import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { assertTransition } from "@/lib/escrow/state-machine";
import { getPaymentGateway } from "@/lib/escrow/gateways";
import { isDemoMode } from "@/lib/demo/mode";
import { demoRecordDeed, pushNotification, readStore, writeStore } from "@/lib/demo/store";
import { mintTrustDeed } from "@/lib/escrow/deeds";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminResolveDisputeSchema, parseBody } from "@/lib/security/validation";
import { recordSecurityEvent } from "@/lib/security/audit";
import type { EscrowStatus } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (isDemoMode()) {
    const store = readStore();
    const disputes = store.disputes.map((d) => ({
      ...d,
      contract: store.contracts.find((c) => c.id === d.contract_id),
      raiser: store.users.find((u) => u.id === d.raised_by)?.profile,
    }));
    return NextResponse.json({ disputes });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("disputes")
    .select("*, contracts(*)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ disputes: data });
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user || user.profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = await parseBody(req, adminResolveDisputeSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (body.status === "resolved" && body.outcome) {
    let gateway;
    try {
      gateway = getPaymentGateway();
    } catch {
      return NextResponse.json({ error: "Payment operations are not configured" }, { status: 503 });
    }
    if (body.outcome === "release" && !gateway.supportsPayout) {
      return NextResponse.json({ error: "Payout processing is not configured" }, { status: 503 });
    }
    if (body.outcome === "refund" && !gateway.supportsRefund) {
      return NextResponse.json({ error: "Refund processing is not configured" }, { status: 503 });
    }
    if (body.outcome === "split" && (!gateway.supportsPayout || !gateway.supportsRefund)) {
      return NextResponse.json({ error: "Split arbitration requires both payout and refund support" }, { status: 503 });
    }
  }

  if (isDemoMode()) {
    const store = readStore();
    const dispute = store.disputes.find((d) => d.id === body.disputeId);
    if (!dispute) return NextResponse.json({ error: "Not found" }, { status: 404 });
    dispute.status = body.status;
    dispute.resolution_notes = body.resolution_notes || dispute.resolution_notes;
    dispute.updated_at = new Date().toISOString();

    const contract = store.contracts.find((c) => c.id === dispute.contract_id);
    if (body.status === "resolved" && contract && body.outcome) {
      dispute.outcome = body.outcome;
      dispute.resolved_by = user.id;

      if (body.outcome === "split") {
        const splitPct = body.split_pct || 50;
        const total = contract.total_amount_etb;
        const freelancerGross = Math.round(total * (splitPct / 100) * 100) / 100;
        const freelancerFee = Math.round(freelancerGross * 0.07 * 100) / 100;
        const freelancerNet = Math.round((freelancerGross - freelancerFee) * 100) / 100;
        const clientRefund = Math.round((total - freelancerGross) * 100) / 100;

        dispute.split_pct = splitPct;
        dispute.freelancer_payout_etb = freelancerNet;
        dispute.client_refund_etb = clientRefund;

        const freelancers = store.users.find((u) => u.id === contract.freelancer_id);
        const gateway = getPaymentGateway();

        await gateway.payout({
          amountEtb: freelancerNet,
          telebirrNumber:
            freelancers?.profile.telebirr_number ||
            freelancers?.profile.phone ||
            "unknown",
          reference: `${contract.payment_reference || contract.id}-split-fl`,
        });

        await gateway.refund({
          amountEtb: clientRefund,
          reference: contract.payment_reference || contract.id,
        });

        contract.escrow_status = "completed";
        contract.updated_at = new Date().toISOString();
        const job = store.jobs.find((j) => j.id === contract.job_id);
        if (job) job.status = "completed";

        // Mint deed for the approved portion
        const gig = contract.gig_id ? store.gigs.find((g) => g.id === contract.gig_id) : undefined;
        const client = store.users.find((u) => u.id === contract.client_id);
        const deed = mintTrustDeed({
          contractId: contract.id,
          jobId: contract.job_id,
          gigId: contract.gig_id,
          projectTitle: job?.title || gig?.title || "MudayHub Freelance Contract",
          category: job?.category || gig?.category || "Professional Services",
          freelancerId: contract.freelancer_id,
          freelancerName: freelancers?.profile.full_name || "Specialist",
          clientName: client?.profile.full_name || "Client",
          amountEtb: freelancerNet,
          platformFeeEtb: freelancerFee,
        });
        demoRecordDeed(deed);
        contract.deed_hash = deed.deed_hash;

        pushNotification(store, contract.client_id, {
          title: "Dispute Resolved (Split Settlement)",
          body: `Arbiter ruled a ${splitPct}% / ${100 - splitPct}% split: ${clientRefund} ETB refunded to your account.`,
          link: `/contracts/${contract.id}`,
        });
        pushNotification(store, contract.freelancer_id, {
          title: "Dispute Resolved (Split Settlement)",
          body: `Arbiter ruled a ${splitPct}% / ${100 - splitPct}% split: ${freelancerNet} ETB disbursed to your Telebirr.`,
          link: `/contracts/${contract.id}`,
        });
      } else {
        const target = body.outcome === "release" ? "completed" : "refunded";
        try {
          assertTransition(contract.escrow_status, target);
          contract.escrow_status = target;
          contract.updated_at = new Date().toISOString();
          if (target === "completed") {
            const freelancers = store.users.find((u) => u.id === contract.freelancer_id);
            const gateway = getPaymentGateway();
            await gateway.payout({
              amountEtb: contract.freelancer_net_etb,
              telebirrNumber:
                freelancers?.profile.telebirr_number ||
                freelancers?.profile.phone ||
                "unknown",
              reference: contract.payment_reference || contract.id,
            });
            const job = store.jobs.find((j) => j.id === contract.job_id);
            if (job) job.status = "completed";

            // Mint deed
            const gig = contract.gig_id ? store.gigs.find((g) => g.id === contract.gig_id) : undefined;
            const client = store.users.find((u) => u.id === contract.client_id);
            const deed = mintTrustDeed({
              contractId: contract.id,
              jobId: contract.job_id,
              gigId: contract.gig_id,
              projectTitle: job?.title || gig?.title || "MudayHub Freelance Contract",
              category: job?.category || gig?.category || "Professional Services",
              freelancerId: contract.freelancer_id,
              freelancerName: freelancers?.profile.full_name || "Specialist",
              clientName: client?.profile.full_name || "Client",
              amountEtb: contract.freelancer_net_etb,
              platformFeeEtb: contract.platform_fee_etb,
            });
            demoRecordDeed(deed);
            contract.deed_hash = deed.deed_hash;
          }
        } catch (e) {
          return NextResponse.json(
            { error: e instanceof Error ? e.message : "Invalid" },
            { status: 400 }
          );
        }
        pushNotification(store, contract.client_id, {
          title: "Dispute resolved",
          body: body.resolution_notes || `Outcome: ${body.outcome}`,
          link: `/contracts/${contract.id}`,
        });
        pushNotification(store, contract.freelancer_id, {
          title: "Dispute resolved",
          body: body.resolution_notes || `Outcome: ${body.outcome}`,
          link: `/contracts/${contract.id}`,
        });
      }

      await recordSecurityEvent({
        actorId: user.id,
        eventType: "admin.dispute.resolved",
        metadata: {
          disputeId: body.disputeId,
          contractId: contract.id,
          outcome: body.outcome,
          splitPct: body.split_pct,
          notes: body.resolution_notes,
        },
      });
    } else {
      await recordSecurityEvent({
        actorId: user.id,
        eventType: "admin.dispute.review_started",
        metadata: { disputeId: body.disputeId, status: body.status },
      });
    }
    writeStore(store);
    return NextResponse.json({ dispute, contract });
  }

  const admin = createAdminClient();
  const { data: dispute } = await admin
    .from("disputes")
    .update({
      status: body.status,
      resolution_notes: body.resolution_notes,
    })
    .eq("id", body.disputeId)
    .select()
    .single();

  if (body.status === "resolved" && body.outcome && dispute) {
    const target = body.outcome === "release" ? "completed" : "refunded";
    const { data: contract } = await admin
      .from("contracts")
      .select("*")
      .eq("id", dispute.contract_id)
      .single();
    if (contract) {
      assertTransition(contract.escrow_status as EscrowStatus, target);
      await admin
        .from("contracts")
        .update({ escrow_status: target })
        .eq("id", contract.id);
    }

    await recordSecurityEvent({
      actorId: user.id,
      eventType: "admin.dispute.resolved",
      metadata: {
        disputeId: body.disputeId,
        contractId: dispute.contract_id,
        outcome: body.outcome,
      },
    });
  } else {
    await recordSecurityEvent({
      actorId: user.id,
      eventType: "admin.dispute.review_started",
      metadata: { disputeId: body.disputeId, status: body.status },
    });
  }

  return NextResponse.json({ dispute });
}
