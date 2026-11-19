-- MudayHub Freelance — 005 payment operation integrity
-- Provider calls occur outside Postgres. These functions create an idempotent
-- operation first and finalize the contract only after the provider confirms it.

ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS resolution_outcome TEXT
  CHECK (resolution_outcome IN ('release', 'refund'));
ALTER TABLE public.disputes ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES public.profiles(id);

CREATE OR REPLACE FUNCTION public.start_deposit_operation(
  p_contract UUID, p_actor UUID, p_provider TEXT
) RETURNS public.payment_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contract public.contracts; v_operation public.payment_operations;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.client_id <> p_actor THEN RAISE EXCEPTION 'Only the client can fund this contract'; END IF;
  IF v_contract.escrow_status <> 'awaiting_deposit' THEN RAISE EXCEPTION 'Contract is not awaiting payment'; END IF;
  SELECT * INTO v_operation FROM public.payment_operations
    WHERE contract_id = p_contract AND kind = 'deposit' AND status = 'pending' FOR UPDATE;
  IF FOUND THEN RETURN v_operation; END IF;
  INSERT INTO public.payment_operations(contract_id, kind, provider, provider_reference, amount_etb)
  VALUES (p_contract, 'deposit', LEFT(p_provider, 40), v_contract.payment_reference, v_contract.total_amount_etb)
  RETURNING * INTO v_operation;
  PERFORM public.log_contract_event(p_contract, p_actor, 'deposit_started', jsonb_build_object('operation_id', v_operation.id, 'provider', p_provider));
  RETURN v_operation;
END $$;

CREATE OR REPLACE FUNCTION public.start_release_operation(
  p_contract UUID, p_actor UUID, p_provider TEXT, p_destination TEXT
) RETURNS public.payment_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_contract public.contracts; v_operation public.payment_operations;
BEGIN
  SELECT * INTO v_contract FROM public.contracts WHERE id = p_contract FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Contract not found'; END IF;
  IF v_contract.client_id <> p_actor AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'Only the client can release this contract'; END IF;
  IF v_contract.escrow_status <> 'work_submitted' THEN RAISE EXCEPTION 'Contract is not ready for release'; END IF;
  IF NULLIF(trim(COALESCE(p_destination, '')), '') IS NULL THEN RAISE EXCEPTION 'Payout destination is missing'; END IF;
  INSERT INTO public.payment_operations(contract_id, kind, provider, amount_etb, destination)
  VALUES (p_contract, 'payout', LEFT(p_provider, 40), v_contract.freelancer_net_etb, LEFT(p_destination, 80))
  RETURNING * INTO v_operation;
  PERFORM public.log_contract_event(p_contract, p_actor, 'payout_started', jsonb_build_object('operation_id', v_operation.id));
  RETURN v_operation;
END $$;

CREATE OR REPLACE FUNCTION public.begin_dispute_review(
  p_dispute UUID, p_actor UUID, p_notes TEXT DEFAULT ''
) RETURNS public.disputes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dispute public.disputes;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dispute not found'; END IF;
  IF v_dispute.status = 'resolved' THEN RAISE EXCEPTION 'Dispute is already resolved'; END IF;
  UPDATE public.disputes SET status = 'under_review', resolution_notes = LEFT(COALESCE(p_notes, resolution_notes, ''), 5000)
    WHERE id = p_dispute RETURNING * INTO v_dispute;
  PERFORM public.log_contract_event(v_dispute.contract_id, p_actor, 'dispute_under_review', jsonb_build_object('dispute_id', p_dispute));
  RETURN v_dispute;
END $$;

CREATE OR REPLACE FUNCTION public.start_dispute_resolution_operation(
  p_dispute UUID, p_actor UUID, p_outcome TEXT, p_notes TEXT, p_provider TEXT, p_destination TEXT DEFAULT NULL
) RETURNS public.payment_operations
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_dispute public.disputes; v_contract public.contracts; v_operation public.payment_operations; v_kind payment_operation_kind; v_amount NUMERIC(12,2);
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_actor AND role = 'admin') THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_outcome NOT IN ('release', 'refund') THEN RAISE EXCEPTION 'Invalid resolution outcome'; END IF;
  SELECT * INTO v_dispute FROM public.disputes WHERE id = p_dispute FOR UPDATE;
  IF NOT FOUND OR v_dispute.status = 'resolved' THEN RAISE EXCEPTION 'Dispute is not available for resolution'; END IF;
  SELECT * INTO v_contract FROM public.contracts WHERE id = v_dispute.contract_id FOR UPDATE;
  IF v_contract.escrow_status <> 'disputed' THEN RAISE EXCEPTION 'Contract is not disputed'; END IF;
  v_kind := CASE WHEN p_outcome = 'release' THEN 'payout'::payment_operation_kind ELSE 'refund'::payment_operation_kind END;
  v_amount := CASE WHEN p_outcome = 'release' THEN v_contract.freelancer_net_etb ELSE v_contract.total_amount_etb END;
  INSERT INTO public.payment_operations(contract_id, kind, provider, amount_etb, destination, metadata)
  VALUES (v_contract.id, v_kind, LEFT(p_provider, 40), v_amount, NULLIF(LEFT(COALESCE(p_destination, ''), 80), ''), jsonb_build_object('dispute_id', p_dispute))
  RETURNING * INTO v_operation;
  UPDATE public.disputes SET status = 'under_review', resolution_notes = LEFT(COALESCE(p_notes, ''), 5000), resolution_outcome = p_outcome, resolved_by = p_actor
    WHERE id = p_dispute;
  PERFORM public.log_contract_event(v_contract.id, p_actor, 'dispute_resolution_started', jsonb_build_object('dispute_id', p_dispute, 'operation_id', v_operation.id, 'outcome', p_outcome));
  RETURN v_operation;
END $$;

CREATE OR REPLACE FUNCTION public.finalize_payment_operation(
  p_operation UUID, p_provider_reference TEXT, p_success BOOLEAN, p_failure_reason TEXT DEFAULT NULL
) RETURNS public.contracts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_operation public.payment_operations; v_contract public.contracts; v_target escrow_status; v_dispute UUID;
BEGIN
  SELECT * INTO v_operation FROM public.payment_operations WHERE id = p_operation FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment operation not found'; END IF;
  SELECT * INTO v_contract FROM public.contracts WHERE id = v_operation.contract_id FOR UPDATE;
  IF v_operation.status = 'succeeded' THEN RETURN v_contract; END IF;
  IF v_operation.status = 'failed' THEN RAISE EXCEPTION 'Payment operation has already failed'; END IF;
  IF NOT p_success THEN
    UPDATE public.payment_operations SET status = 'failed', failure_reason = LEFT(COALESCE(p_failure_reason, 'Provider rejected operation'), 1000), completed_at = NOW()
      WHERE id = p_operation;
    PERFORM public.log_contract_event(v_contract.id, NULL, 'payment_failed', jsonb_build_object('operation_id', p_operation, 'kind', v_operation.kind));
    RETURN v_contract;
  END IF;
  IF NULLIF(trim(COALESCE(p_provider_reference, '')), '') IS NULL THEN RAISE EXCEPTION 'Provider reference is required'; END IF;
  v_target := CASE v_operation.kind
    WHEN 'deposit' THEN 'funded'::escrow_status
    WHEN 'payout' THEN 'completed'::escrow_status
    WHEN 'refund' THEN 'refunded'::escrow_status
  END;
  IF (v_operation.kind = 'deposit' AND v_contract.escrow_status <> 'awaiting_deposit')
    OR (v_operation.kind = 'payout' AND v_contract.escrow_status NOT IN ('work_submitted', 'disputed'))
    OR (v_operation.kind = 'refund' AND v_contract.escrow_status <> 'disputed') THEN
    RAISE EXCEPTION 'Contract state does not allow this payment operation';
  END IF;
  UPDATE public.payment_operations SET status = 'succeeded', provider_reference = LEFT(p_provider_reference, 255), completed_at = NOW()
    WHERE id = p_operation;
  UPDATE public.contracts SET escrow_status = v_target WHERE id = v_contract.id RETURNING * INTO v_contract;
  IF v_target = 'completed' AND v_contract.job_id IS NOT NULL THEN UPDATE public.jobs SET status = 'completed' WHERE id = v_contract.job_id; END IF;
  IF v_target = 'completed' AND v_contract.gig_id IS NOT NULL THEN UPDATE public.gigs SET orders_completed = orders_completed + 1 WHERE id = v_contract.gig_id; END IF;
  SELECT (v_operation.metadata ->> 'dispute_id')::UUID INTO v_dispute;
  IF v_dispute IS NOT NULL THEN UPDATE public.disputes SET status = 'resolved', updated_at = NOW() WHERE id = v_dispute; END IF;
  PERFORM public.log_contract_event(v_contract.id, NULL, 'payment_succeeded', jsonb_build_object('operation_id', p_operation, 'kind', v_operation.kind, 'provider_reference', p_provider_reference));
  INSERT INTO public.notifications(user_id, title, body, link) VALUES
    (v_contract.client_id, CASE WHEN v_target = 'funded' THEN 'Deposit confirmed' WHEN v_target = 'completed' THEN 'Contract completed' ELSE 'Refund completed' END,
     'Payment processing completed.', '/contracts/' || v_contract.id),
    (v_contract.freelancer_id, CASE WHEN v_target = 'funded' THEN 'Contract funded' WHEN v_target = 'completed' THEN 'Payment completed' ELSE 'Contract refunded' END,
     'Payment processing completed.', '/contracts/' || v_contract.id);
  RETURN v_contract;
END $$;

REVOKE ALL ON FUNCTION public.start_deposit_operation(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_release_operation(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.begin_dispute_review(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.start_dispute_resolution_operation(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.finalize_payment_operation(UUID, TEXT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.start_deposit_operation(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_release_operation(UUID, UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.begin_dispute_review(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_dispute_resolution_operation(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_payment_operation(UUID, TEXT, BOOLEAN, TEXT) TO service_role;
