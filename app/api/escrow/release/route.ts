import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { assertTransition, canTransition } from "@/lib/escrow/state-machine";
import { getPaymentGateway } from "@/lib/escrow/gateways";
import { isDemoMode } from "@/lib/demo/mode";
import { demoRecordDeed, pushNotification, readStore, writeStore } from "@/lib/demo/store";
import { mintTrustDeed } from "@/lib/escrow/deeds";
import { createAdminClient } from "@/lib/supabase/admin";
import { escrowReleaseSchema, parseBody } from "@/lib/security/validation";
import { recordSecurityEvent } from "@/lib/security/audit";
import type { EscrowStatus } from "@/lib/types";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseBody(req, escrowReleaseSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { contractId, milestoneId } = parsed.data;

  let gateway;
  try {
    gateway = getPaymentGateway();
  } catch {
    return NextResponse.json({ error: "Payments are not configured" }, { status: 503 });
  }

  if (!gateway.supportsPayout) {
    return NextResponse.json(
      { error: "Automated payouts are not configured. Funds cannot be released through this provider yet." },
      { status: 503 }
    );
  }

  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === contractId);
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (contract.client_id !== user.id && user.profile.role !== "admin") {
      return NextResponse.json({ error: "Only client can release" }, { status: 403 });
    }

    const freelancer = store.users.find((u) => u.id === contract.freelancer_id);
    const destination =
      freelancer?.profile.telebirr_number || freelancer?.profile.phone || "unknown";

    if (milestoneId && contract.milestones && contract.milestones.length > 0) {
      const milestone = contract.milestones.find((m) => m.id === milestoneId);
      if (!milestone) return NextResponse.json({ error: "Milestone not found" }, { status: 404 });

      const netAmount = Math.round(milestone.amount_etb * 0.93 * 100) / 100;
      const payout = await gateway.payout({
        amountEtb: netAmount,
        telebirrNumber: destination,
        reference: `${contract.payment_reference || contract.id}-m${milestone.ordinal}`,
      });

      milestone.status = "completed";
      milestone.updated_at = new Date().toISOString();

      const allDone = contract.milestones.every((m) => m.status === "completed");
      if (allDone) {
        contract.escrow_status = "completed";
        contract.updated_at = new Date().toISOString();
        const job = store.jobs.find((j) => j.id === contract.job_id);
        if (job) job.status = "completed";

        const gig = contract.gig_id ? store.gigs.find((g) => g.id === contract.gig_id) : undefined;
        const client = store.users.find((u) => u.id === contract.client_id);
        const deed = mintTrustDeed({
          contractId: contract.id,
          jobId: contract.job_id,
          gigId: contract.gig_id,
          projectTitle: job?.title || gig?.title || "MudayHub Freelance Contract",
          category: job?.category || gig?.category || "Professional Services",
          freelancerId: contract.freelancer_id,
          freelancerName: freelancer?.profile.full_name || "Specialist",
          clientName: client?.profile.full_name || "Client",
          amountEtb: contract.freelancer_net_etb,
          platformFeeEtb: contract.platform_fee_etb,
          milestoneCount: contract.milestones?.length || 1,
        });
        demoRecordDeed(deed);
        contract.deed_hash = deed.deed_hash;
      }

      pushNotification(store, contract.freelancer_id, {
        title: "Milestone released",
        body: `${netAmount} ETB for '${milestone.title}' sent to Telebirr (${payout.transferId}).`,
        link: `/contracts/${contract.id}`,
      });
      writeStore(store);

      await recordSecurityEvent({
        actorId: user.id,
        eventType: "escrow.milestone.released",
        metadata: { contractId, milestoneId, amountEtb: netAmount, destination },
      });

      return NextResponse.json({ contract, payout, milestone });
    }

    try {
      assertTransition(contract.escrow_status, "completed");
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid" },
        { status: 400 }
      );
    }

    const payout = await gateway.payout({
      amountEtb: contract.freelancer_net_etb,
      telebirrNumber: destination,
      reference: contract.payment_reference || contract.id,
    });

    contract.escrow_status = "completed";
    contract.updated_at = new Date().toISOString();
    if (contract.milestones) {
      contract.milestones.forEach((m) => {
        m.status = "completed";
      });
    }

    const job = store.jobs.find((j) => j.id === contract.job_id);
    if (job) job.status = "completed";

    // Mint immutable cryptographic Trust Deed
    const gig = contract.gig_id ? store.gigs.find((g) => g.id === contract.gig_id) : undefined;
    const client = store.users.find((u) => u.id === contract.client_id);
    const deed = mintTrustDeed({
      contractId: contract.id,
      jobId: contract.job_id,
      gigId: contract.gig_id,
      projectTitle: job?.title || gig?.title || "MudayHub Freelance Contract",
      category: job?.category || gig?.category || "Professional Services",
      freelancerId: contract.freelancer_id,
      freelancerName: freelancer?.profile.full_name || "Specialist",
      clientName: client?.profile.full_name || "Client",
      amountEtb: contract.freelancer_net_etb,
      platformFeeEtb: contract.platform_fee_etb,
      milestoneCount: contract.milestones?.length || 1,
    });
    demoRecordDeed(deed);
    contract.deed_hash = deed.deed_hash;

    // Reputation bump for completed on-platform work
    if (freelancer) {
      freelancer.profile.rating = Math.min(
        5,
        Math.round((freelancer.profile.rating + 0.05) * 100) / 100
      );
    }

    pushNotification(store, contract.freelancer_id, {
      title: "Funds released",
      body: `${contract.freelancer_net_etb} ETB sent to Telebirr (${payout.transferId}).`,
      link: `/contracts/${contract.id}`,
    });
    writeStore(store);

    await recordSecurityEvent({
      actorId: user.id,
      eventType: "escrow.funds.released",
      metadata: { contractId, amountEtb: contract.freelancer_net_etb, destination },
    });

    return NextResponse.json({ contract, payout });
  }

  const admin = createAdminClient();
  const { data: contract } = await admin
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single();
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (contract.client_id !== user.id && user.profile.role !== "admin") {
    return NextResponse.json({ error: "Only client can release" }, { status: 403 });
  }

  // Legal source states for a release are work_submitted / disputed
  // (admin override). CAS on the state column so a concurrent double-click
  // or race can only release once.
  const legalFrom = (["work_submitted", "disputed"] as EscrowStatus[]).filter((s) =>
    canTransition(s, "completed")
  );
  if (!legalFrom.includes(contract.escrow_status as EscrowStatus)) {
    return NextResponse.json(
      { error: `Invalid escrow transition: ${contract.escrow_status} → completed` },
      { status: 400 }
    );
  }
  const { data: flipped, error: casErr } = await admin
    .from("contracts")
    .update({ escrow_status: "completed" })
    .eq("id", contractId)
    .in("escrow_status", legalFrom)
    .select();
  if (casErr) return NextResponse.json({ error: casErr.message }, { status: 500 });
  if (!flipped || flipped.length === 0) {
    return NextResponse.json(
      { error: "Release failed: contract state changed concurrently" },
      { status: 409 }
    );
  }

  const { data: freelancers } = await admin
    .from("profiles")
    .select("telebirr_number, phone, rating")
    .eq("id", contract.freelancer_id)
    .single();

  // Payout AFTER the state flip; on transfer failure, roll back so the
  // status stays in sync with reality and the client can retry.
  const payout = await gateway.payout({
    amountEtb: Number(contract.freelancer_net_etb),
    telebirrNumber: freelancers?.telebirr_number || freelancers?.phone || "unknown",
    reference: contract.payment_reference,
  });

  if (!payout.success) {
    await admin
      .from("contracts")
      .update({ escrow_status: contract.escrow_status })
      .eq("id", contractId)
      .eq("escrow_status", "completed");
    await admin.from("notifications").insert({
      user_id: user.id,
      title: "Payout transfer failed",
      body: "Escrow was not released. Retry the release or raise a dispute.",
      link: `/contracts/${contractId}`,
    });
    return NextResponse.json({ error: "Payout transfer failed; state rolled back" }, { status: 502 });
  }
  await admin.from("jobs").update({ status: "completed" }).eq("id", contract.job_id);

  if (freelancers) {
    await admin
      .from("profiles")
      .update({
        rating: Math.min(5, Math.round((Number(freelancers.rating) + 0.05) * 100) / 100),
      })
      .eq("id", contract.freelancer_id);
  }

  await admin.from("notifications").insert({
    user_id: contract.freelancer_id,
    title: "Funds released",
    body: `${contract.freelancer_net_etb} ETB sent to Telebirr (${payout.transferId}).`,
    link: `/contracts/${contractId}`,
  });

  await recordSecurityEvent({
    actorId: user.id,
    eventType: "escrow.funds.released",
    metadata: { contractId, amountEtb: Number(contract.freelancer_net_etb) },
  });

  return NextResponse.json({
    contract: { ...contract, escrow_status: "completed" },
    payout,
  });
}
