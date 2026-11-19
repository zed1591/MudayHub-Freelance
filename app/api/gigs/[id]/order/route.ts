import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoOrderGig } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { orderGigSchema, parseBody } from "@/lib/security/validation";
import { recordSecurityEvent } from "@/lib/security/audit";
import type { Contract } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Layer 4 Authorization Check: verify role before proceeding to business logic
  if (user.profile.role !== "client" && user.profile.role !== "admin") {
    return NextResponse.json({ error: "Only clients can order services" }, { status: 403 });
  }

  // Layer 3 Strict Input Validation
  const parsed = await parseBody(req, orderGigSchema);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const body = parsed.data;

  if (isDemoMode()) {
    try {
      const contract = demoOrderGig({
        gigId: id,
        packageTier: body.packageTier,
        clientId: user.id,
        requirements: body.requirements,
      });
      await recordSecurityEvent({
        actorId: user.id,
        eventType: "escrow.checkout.created",
        metadata: { gigId: id, packageTier: body.packageTier, contractId: contract.id },
      });
      return NextResponse.json({ contract }, { status: 201 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to order gig";
      return NextResponse.json({ error: msg }, { status: msg === "Gig not found" ? 404 : 400 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("order_gig", {
    p_gig: id,
    p_tier: body.packageTier,
    p_actor: user.id,
    p_requirements: body.requirements?.trim().slice(0, 5000) || "",
  }) as { data: Contract | null; error: { message: string } | null };

  if (error || !data) {
    const message = error?.message || "Unable to create service contract";
    return NextResponse.json({ error: message }, { status: message === "Service not found" ? 404 : 400 });
  }

  await recordSecurityEvent({
    actorId: user.id,
    eventType: "escrow.checkout.created",
    metadata: { gigId: id, packageTier: body.packageTier, contractId: data.id },
  });

  return NextResponse.json({ contract: data }, { status: 201 });
}
