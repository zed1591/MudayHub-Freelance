import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfiles } from "@/lib/public-profiles";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoMode()) {
    const store = readStore();
    const contracts = store.contracts
      .filter(
        (c) =>
          c.client_id === user.id ||
          c.freelancer_id === user.id ||
          user.profile.role === "admin"
      )
      .map((c) => ({
        ...c,
        jobs: store.jobs.find((j) => j.id === c.job_id),
        gigs: store.gigs?.find((g) => g.id === c.gig_id),
        client: store.users.find((u) => u.id === c.client_id)?.profile,
        freelancer: store.users.find((u) => u.id === c.freelancer_id)?.profile,
      }));
    return NextResponse.json({ contracts });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("*, jobs(title, category), gigs(title, category, cover_image)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    const profiles = await getPublicProfiles(supabase, (data || []).flatMap((contract) => [contract.client_id, contract.freelancer_id]));
    return NextResponse.json({ contracts: (data || []).map((contract) => ({
      ...contract,
      client: profiles.get(contract.client_id),
      freelancer: profiles.get(contract.freelancer_id),
    })) });
  } catch (profileError) {
    return NextResponse.json({ error: profileError instanceof Error ? profileError.message : "Unable to load profiles" }, { status: 500 });
  }
}
