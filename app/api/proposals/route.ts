import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { pushNotification, readStore, writeStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfiles } from "@/lib/public-profiles";
import { parseBody, proposalSchema } from "@/lib/security/validation";
import type { Proposal } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (isDemoMode()) {
    const store = readStore();
    let proposals: Proposal[] = [];
    if (user.profile.role === "freelancer") {
      proposals = store.proposals.filter((p) => p.freelancer_id === user.id);
    } else if (user.profile.role === "client") {
      const jobIds = new Set(store.jobs.filter((j) => j.client_id === user.id).map((j) => j.id));
      proposals = store.proposals.filter((p) => jobIds.has(p.job_id));
    } else {
      proposals = store.proposals;
    }
    const enriched = proposals.map((p) => ({
      ...p,
      jobs: store.jobs.find((j) => j.id === p.job_id),
      profiles: store.users.find((u) => u.id === p.freelancer_id)?.profile,
    }));
    return NextResponse.json({ proposals: enriched });
  }

  const supabase = await createClient();
  let query = supabase
    .from("proposals")
    .select("*, jobs(title, budget_etb, client_id, status)")
    .order("created_at", { ascending: false });

  if (user.profile.role === "freelancer") {
    query = query.eq("freelancer_id", user.id);
  } else if (user.profile.role === "client") {
    query = query.eq("jobs.client_id", user.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    const profiles = await getPublicProfiles(supabase, (data || []).map((proposal) => proposal.freelancer_id));
    return NextResponse.json({ proposals: (data || []).map((proposal) => ({ ...proposal, profiles: profiles.get(proposal.freelancer_id) })) });
  } catch (profileError) {
    return NextResponse.json({ error: profileError instanceof Error ? profileError.message : "Unable to load profiles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile.role !== "freelancer" && user.profile.role !== "admin") {
    return NextResponse.json({ error: "Only freelancers can propose" }, { status: 403 });
  }

  const parsed = await parseBody(req, proposalSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (isDemoMode()) {
    const store = readStore();
    const job = store.jobs.find((j) => j.id === body.job_id);
    if (!job || job.status !== "open") {
      return NextResponse.json({ error: "Job not open" }, { status: 400 });
    }
    if (job.client_id === user.id) {
      return NextResponse.json({ error: "Cannot propose on your own job" }, { status: 400 });
    }
    if (store.proposals.some((p) => p.job_id === body.job_id && p.freelancer_id === user.id)) {
      return NextResponse.json({ error: "You already proposed on this job" }, { status: 400 });
    }
    const proposal: Proposal = {
      id: randomUUID(),
      job_id: body.job_id,
      freelancer_id: user.id,
      bid_amount_etb: body.bid_amount_etb,
      duration_days: body.duration_days,
      cover_letter: body.cover_letter,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    store.proposals.push(proposal);
    pushNotification(store, job.client_id, {
      title: "New proposal",
      body: `${user.profile.full_name} proposed ${body.bid_amount_etb} ETB on "${job.title}"`,
      link: `/jobs/${job.id}`,
    });
    writeStore(store);
    return NextResponse.json({ proposal });
  }

  const supabase = await createClient();
  const { data: job } = await supabase.from("jobs").select("client_id, status").eq("id", body.job_id).single();
  if (!job || job.status !== "open") {
    return NextResponse.json({ error: "Job not open" }, { status: 400 });
  }
  if (job.client_id === user.id) {
    return NextResponse.json({ error: "Cannot propose on your own job" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      job_id: body.job_id,
      freelancer_id: user.id,
      bid_amount_etb: body.bid_amount_etb,
      duration_days: body.duration_days,
      cover_letter: body.cover_letter,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ proposal: data });
}
