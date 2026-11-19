import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPublicProfiles } from "@/lib/public-profiles";
import type {
  IContractRepository,
  IGigRepository,
  IJobRepository,
  IProfileRepository,
  IProposalRepository,
} from "../types";
import type {
  Contract,
  EscrowStatus,
  Gig,
  Job,
  Milestone,
  MilestoneStatus,
  Profile,
  Proposal,
  ProposalStatus,
} from "@/lib/types";

export class SupabaseContractRepository implements IContractRepository {
  async findById(id: string): Promise<Contract | null> {
    const admin = createAdminClient();
    const { data: contract, error } = await admin
      .from("contracts")
      .select("*, jobs(title, category), gigs(title, category, cover_image)")
      .eq("id", id)
      .single();

    if (error || !contract) return null;

    const supabase = await createClient();
    const profiles = await getPublicProfiles(supabase, [
      contract.client_id,
      contract.freelancer_id,
    ]);

    const { data: milestones } = await admin
      .from("milestones")
      .select("*")
      .eq("contract_id", id)
      .order("ordinal", { ascending: true });

    const { data: reviews } = await admin
      .from("reviews")
      .select("*, author:profiles!reviews_author_id_fkey(full_name, role)")
      .eq("contract_id", id);

    return {
      ...contract,
      client: profiles.get(contract.client_id),
      freelancer: profiles.get(contract.freelancer_id),
      milestones: (milestones as Milestone[]) || [],
      reviews: reviews || [],
    };
  }

  async findByUser(userId: string): Promise<Contract[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contracts")
      .select("*, jobs(title, category), gigs(title, category, cover_image)")
      .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const profiles = await getPublicProfiles(
      supabase,
      data.flatMap((c) => [c.client_id, c.freelancer_id])
    );

    return data.map((c) => ({
      ...c,
      client: profiles.get(c.client_id),
      freelancer: profiles.get(c.freelancer_id),
    }));
  }

  async createContract(
    data: Omit<Contract, "id" | "created_at" | "updated_at">,
    milestonesData?: Array<Omit<Milestone, "id" | "contract_id" | "created_at" | "updated_at">>
  ): Promise<Contract> {
    const admin = createAdminClient();
    const { data: contract, error } = await admin
      .from("contracts")
      .insert(data)
      .select()
      .single();

    if (error || !contract) {
      throw new Error(error?.message || "Failed to create contract");
    }

    if (milestonesData && milestonesData.length > 0) {
      const inserts = milestonesData.map((m, idx) => ({
        ...m,
        contract_id: contract.id,
        ordinal: idx + 1,
      }));
      await admin.from("milestones").insert(inserts);
    } else {
      // Create default 100% milestone
      await admin.from("milestones").insert({
        contract_id: contract.id,
        ordinal: 1,
        title: "Full Project Delivery",
        amount_etb: contract.total_amount_etb,
        due_days: 7,
        status: "funded",
      });
    }

    return contract as Contract;
  }

  async updateStatus(
    id: string,
    status: EscrowStatus,
    extras?: Partial<Contract>
  ): Promise<Contract> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("contracts")
      .update({ escrow_status: status, ...(extras || {}) })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update contract status");
    }
    return data as Contract;
  }

  async submitWork(id: string, submissionUrl: string, notes?: string): Promise<Contract> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("contracts")
      .update({
        escrow_status: "work_submitted",
        work_submission_url: submissionUrl,
        work_submission_notes: notes || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to submit work");
    }
    return data as Contract;
  }

  async requestRevision(id: string, notes: string): Promise<Contract> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("contracts")
      .update({
        escrow_status: "funded",
        revision_requested: true,
        revision_notes: notes,
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to request revision");
    }
    return data as Contract;
  }

  async getMilestones(contractId: string): Promise<Milestone[]> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("milestones")
      .select("*")
      .eq("contract_id", contractId)
      .order("ordinal", { ascending: true });

    if (error || !data) return [];
    return data as Milestone[];
  }

  async updateMilestoneStatus(
    milestoneId: string,
    status: MilestoneStatus,
    extras?: Partial<Milestone>
  ): Promise<Milestone> {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("milestones")
      .update({ status, ...(extras || {}) })
      .eq("id", milestoneId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || "Failed to update milestone status");
    }
    return data as Milestone;
  }
}

export class SupabaseJobRepository implements IJobRepository {
  async findById(id: string): Promise<Job | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*, profiles:client_id(full_name, is_verified, rating)")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Job;
  }

  async findOpen(category?: string): Promise<Job[]> {
    const supabase = await createClient();
    let query = supabase
      .from("jobs")
      .select("*, profiles:client_id(full_name, is_verified, rating)")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category", category);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data as Job[];
  }

  async findByClient(clientId: string): Promise<Job[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Job[];
  }

  async create(data: Omit<Job, "id" | "created_at">): Promise<Job> {
    const supabase = await createClient();
    const { data: job, error } = await supabase
      .from("jobs")
      .insert(data)
      .select()
      .single();

    if (error || !job) throw new Error(error?.message || "Failed to post job");
    return job as Job;
  }

  async update(id: string, updates: Partial<Job>): Promise<Job> {
    const supabase = await createClient();
    const { data: job, error } = await supabase
      .from("jobs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !job) throw new Error(error?.message || "Failed to update job");
    return job as Job;
  }

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    return !error;
  }
}

export class SupabaseProposalRepository implements IProposalRepository {
  async findById(id: string): Promise<Proposal | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("proposals")
      .select("*, profiles:freelancer_id(full_name, rating, is_verified, skills), jobs(title, budget_etb, client_id, status)")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Proposal;
  }

  async findByJob(jobId: string): Promise<Proposal[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("proposals")
      .select("*, profiles:freelancer_id(full_name, rating, is_verified, skills)")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Proposal[];
  }

  async findByFreelancer(freelancerId: string): Promise<Proposal[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("proposals")
      .select("*, jobs(title, budget_etb, client_id, status)")
      .eq("freelancer_id", freelancerId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Proposal[];
  }

  async create(data: Omit<Proposal, "id" | "created_at">): Promise<Proposal> {
    const supabase = await createClient();
    const { data: proposal, error } = await supabase
      .from("proposals")
      .insert(data)
      .select()
      .single();

    if (error || !proposal) {
      throw new Error(error?.message || "Failed to submit proposal");
    }
    return proposal as Proposal;
  }

  async updateStatus(id: string, status: ProposalStatus): Promise<Proposal> {
    const admin = createAdminClient();
    const { data: proposal, error } = await admin
      .from("proposals")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error || !proposal) {
      throw new Error(error?.message || "Failed to update proposal status");
    }
    return proposal as Proposal;
  }
}

export class SupabaseGigRepository implements IGigRepository {
  async findPublished(category?: string, query?: string): Promise<Gig[]> {
    const supabase = await createClient();
    let q = supabase
      .from("gigs")
      .select("*, freelancer:profiles!gigs_freelancer_id_fkey(id, full_name, rating, is_verified, skills, bio, phone)")
      .eq("is_published", true)
      .order("rating", { ascending: false });

    if (category) {
      q = q.eq("category", category);
    }
    const { data, error } = await q;
    if (error || !data) return [];

    if (query) {
      const lower = query.toLowerCase();
      return (data as Gig[]).filter(
        (g) =>
          g.title.toLowerCase().includes(lower) ||
          g.description.toLowerCase().includes(lower) ||
          g.tags.some((t) => t.toLowerCase().includes(lower))
      );
    }
    return data as Gig[];
  }

  async findById(id: string): Promise<Gig | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gigs")
      .select("*, freelancer:profiles!gigs_freelancer_id_fkey(id, full_name, rating, is_verified, skills, bio, phone)")
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();

    if (error || !data) return null;
    return data as Gig;
  }

  async findByFreelancer(freelancerId: string): Promise<Gig[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gigs")
      .select("*")
      .eq("freelancer_id", freelancerId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Gig[];
  }

  async create(
    data: Omit<Gig, "id" | "created_at" | "rating" | "reviews_count" | "orders_completed">
  ): Promise<Gig> {
    const supabase = await createClient();
    const { data: gig, error } = await supabase
      .from("gigs")
      .insert(data)
      .select()
      .single();

    if (error || !gig) throw new Error(error?.message || "Failed to create gig");
    return gig as Gig;
  }

  async update(id: string, updates: Partial<Gig>): Promise<Gig> {
    const supabase = await createClient();
    const { data: gig, error } = await supabase
      .from("gigs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !gig) throw new Error(error?.message || "Failed to update gig");
    return gig as Gig;
  }

  async delete(id: string): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase.from("gigs").delete().eq("id", id);
    return !error;
  }
}

export class SupabaseProfileRepository implements IProfileRepository {
  async findById(id: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as Profile;
  }

  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) throw new Error(error?.message || "Failed to update profile");
    return data as Profile;
  }

  async searchSpecialists(skills?: string[], minRating?: number): Promise<Profile[]> {
    const supabase = await createClient();
    let q = supabase
      .from("profiles")
      .select("*")
      .eq("role", "freelancer")
      .order("rating", { ascending: false });

    if (minRating) {
      q = q.gte("rating", minRating);
    }
    const { data, error } = await q;
    if (error || !data) return [];

    if (skills && skills.length > 0) {
      return (data as Profile[]).filter((p) =>
        skills.some((s) => p.skills.map((ps) => ps.toLowerCase()).includes(s.toLowerCase()))
      );
    }
    return data as Profile[];
  }
}
