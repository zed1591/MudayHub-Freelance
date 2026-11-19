import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfiles } from "@/lib/public-profiles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoMode()) {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === id);
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (
      contract.client_id !== user.id &&
      contract.freelancer_id !== user.id &&
      user.profile.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const disputes = store.disputes.filter((d) => d.contract_id === id);
    const messages = store.messages.filter((m) => m.contract_id === id);
    const reviews = (store.reviews || []).filter((r) => r.contract_id === id);
    return NextResponse.json({
      contract: {
        ...contract,
        jobs: store.jobs.find((j) => j.id === contract.job_id),
        gigs: store.gigs?.find((g) => g.id === contract.gig_id),
        client: store.users.find((u) => u.id === contract.client_id)?.profile,
        freelancer: store.users.find((u) => u.id === contract.freelancer_id)?.profile,
        reviews,
      },
      disputes,
      messages,
    });
  }

  const supabase = await createClient();
  const { data: contract, error } = await supabase
    .from("contracts")
    .select("*, jobs(title, category), gigs(title, category, cover_image)")
    .eq("id", id)
    .single();
  if (error || !contract) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    contract.client_id !== user.id &&
    contract.freelancer_id !== user.id &&
    user.profile.role !== "admin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const [{ data: disputes }, { data: messages }, { data: reviews }, profiles] = await Promise.all([
    supabase.from("disputes").select("*").eq("contract_id", id),
    supabase.from("messages").select("*").eq("contract_id", id).order("created_at"),
    supabase.from("reviews").select("*").eq("contract_id", id),
    getPublicProfiles(supabase, [contract.client_id, contract.freelancer_id]),
  ]);
  return NextResponse.json({
    contract: { ...contract, client: profiles.get(contract.client_id), freelancer: profiles.get(contract.freelancer_id), reviews },
    disputes,
    messages,
  });
}
