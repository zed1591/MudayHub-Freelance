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

  if (isDemoMode()) {
    const store = readStore();
    const job = store.jobs.find((j) => j.id === id);
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const client = store.users.find((u) => u.id === job.client_id)?.profile;
    const proposals =
      user && (user.id === job.client_id || user.profile.role === "admin")
        ? store.proposals
            .filter((p) => p.job_id === id)
            .map((p) => ({
              ...p,
              profiles: store.users.find((u) => u.id === p.freelancer_id)?.profile,
            }))
        : user
          ? store.proposals.filter((p) => p.job_id === id && p.freelancer_id === user.id)
          : [];
    return NextResponse.json({ job: { ...job, profiles: client }, proposals });
  }

  const supabase = await createClient();
  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let proposals = [];
  if (user) {
    const q = supabase.from("proposals").select("*").eq("job_id", id);
    const { data } =
      user.id === job.client_id || user.profile.role === "admin"
        ? await q
        : await q.eq("freelancer_id", user.id);
    proposals = data || [];
  }

  try {
    const profiles = await getPublicProfiles(supabase, [job.client_id, ...proposals.map((proposal) => proposal.freelancer_id)]);
    return NextResponse.json({
      job: { ...job, profiles: profiles.get(job.client_id) },
      proposals: proposals.map((proposal) => ({ ...proposal, profiles: profiles.get(proposal.freelancer_id) })),
    });
  } catch (profileError) {
    return NextResponse.json({ error: profileError instanceof Error ? profileError.message : "Unable to load profiles" }, { status: 500 });
  }
}
