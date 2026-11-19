import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo/mode";
import { demoGetDeedByHash } from "@/lib/demo/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyTrustDeed } from "@/lib/escrow/deeds";
import type { TrustDeed } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  if (!hash || hash.trim().length < 10) {
    return NextResponse.json({ error: "Invalid deed hash" }, { status: 400 });
  }

  let deed: TrustDeed | null = null;

  if (isDemoMode()) {
    deed = demoGetDeedByHash(hash);
  } else {
    const admin = createAdminClient();
    const { data } = await admin
      .from("trust_deeds")
      .select("*")
      .ilike("deed_hash", hash)
      .maybeSingle();
    deed = data as TrustDeed | null;
  }

  if (!deed) {
    return NextResponse.json(
      { error: "Trust deed not found for this cryptographic identifier" },
      { status: 404 }
    );
  }

  const verification = verifyTrustDeed(deed);

  return NextResponse.json({
    deed,
    verification: {
      isValid: verification.isValid,
      tampered: verification.tampered,
      hash: deed.deed_hash,
      signature: deed.signature,
      verifiedAt: new Date().toISOString(),
    },
  });
}
