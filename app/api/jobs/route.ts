import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { readStore, writeStore } from "@/lib/demo/store";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfiles } from "@/lib/public-profiles";
import type { Job } from "@/lib/types";
import { jobSchema, parseBody } from "@/lib/security/validation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();
  const clientId = searchParams.get("client_id");

  if (isDemoMode()) {
    const store = readStore();
    let jobs = clientId 
      ? store.jobs.filter((j) => j.client_id === clientId)
      : store.jobs.filter((j) => j.status === "open");
    if (category) jobs = jobs.filter((j) => j.category === category);
    if (q) {
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    const enriched = jobs.map((job) => ({
      ...job,
      profiles: store.users.find((u) => u.id === job.client_id)?.profile,
      proposals_count: store.proposals.filter((p) => p.job_id === job.id).length,
    }));
    return NextResponse.json({ jobs: enriched });
  }

  const supabase = await createClient();
  let query = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });
  if (clientId) {
    query = query.eq("client_id", clientId);
  } else {
    query = query.eq("status", "open");
  }
  if (category) query = query.eq("category", category);
  if (q) query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  try {
    const profiles = await getPublicProfiles(supabase, (data || []).map((job) => job.client_id));
    return NextResponse.json({ jobs: (data || []).map((job) => ({ ...job, profiles: profiles.get(job.client_id) })) });
  } catch (profileError) {
    return NextResponse.json({ error: profileError instanceof Error ? profileError.message : "Unable to load profiles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.profile.role !== "client" && user.profile.role !== "admin") {
    return NextResponse.json({ error: "Only clients can post jobs" }, { status: 403 });
  }

  const parsed = await parseBody(req, jobSchema);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (isDemoMode()) {
    const store = readStore();
    const job: Job = {
      id: randomUUID(),
      client_id: user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      budget_etb: body.budget_etb,
      status: "open",
      skills: body.skills || [],
      created_at: new Date().toISOString(),
    };
    store.jobs.unshift(job);
    writeStore(store);
    return NextResponse.json({ job });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert({
      client_id: user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      budget_etb: body.budget_etb,
      skills: body.skills || [],
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ job: data });
}
