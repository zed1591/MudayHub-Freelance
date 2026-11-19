import { randomUUID } from "crypto";
import { readStore, writeStore } from "@/lib/demo/store";
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

export class DemoContractRepository implements IContractRepository {
  async findById(id: string): Promise<Contract | null> {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === id);
    if (!contract) return null;

    // Attach related profile / gig / job metadata if present
    const client = store.users.find((u) => u.id === contract.client_id)?.profile;
    const freelancer = store.users.find((u) => u.id === contract.freelancer_id)?.profile;
    const gig = contract.gig_id ? store.gigs.find((g) => g.id === contract.gig_id) : undefined;
    const job = contract.job_id ? store.jobs.find((j) => j.id === contract.job_id) : undefined;
    const reviews = store.reviews.filter((r) => r.contract_id === contract.id);

    return {
      ...contract,
      client: client ? { full_name: client.full_name, phone: client.phone } : undefined,
      freelancer: freelancer
        ? { full_name: freelancer.full_name, telebirr_number: freelancer.telebirr_number }
        : undefined,
      gigs: gig ? { title: gig.title, category: gig.category, cover_image: gig.cover_image } : undefined,
      jobs: job ? { title: job.title, category: job.category } : undefined,
      reviews,
    };
  }

  async findByUser(userId: string): Promise<Contract[]> {
    const store = readStore();
    return store.contracts
      .filter((c) => c.client_id === userId || c.freelancer_id === userId)
      .map((c) => {
        const client = store.users.find((u) => u.id === c.client_id)?.profile;
        const freelancer = store.users.find((u) => u.id === c.freelancer_id)?.profile;
        const gig = c.gig_id ? store.gigs.find((g) => g.id === c.gig_id) : undefined;
        const job = c.job_id ? store.jobs.find((j) => j.id === c.job_id) : undefined;
        return {
          ...c,
          client: client ? { full_name: client.full_name, phone: client.phone } : undefined,
          freelancer: freelancer
            ? { full_name: freelancer.full_name, telebirr_number: freelancer.telebirr_number }
            : undefined,
          gigs: gig ? { title: gig.title, category: gig.category, cover_image: gig.cover_image } : undefined,
          jobs: job ? { title: job.title, category: job.category } : undefined,
        };
      });
  }

  async createContract(
    data: Omit<Contract, "id" | "created_at" | "updated_at">,
    milestonesData?: Array<Omit<Milestone, "id" | "contract_id" | "created_at" | "updated_at">>
  ): Promise<Contract> {
    const store = readStore();
    const id = randomUUID();
    const now = new Date().toISOString();

    const milestones: Milestone[] = (milestonesData && milestonesData.length > 0)
      ? milestonesData.map((m, idx) => ({
          ...m,
          id: randomUUID(),
          contract_id: id,
          ordinal: idx + 1,
          created_at: now,
          updated_at: now,
        }))
      : [
          {
            id: randomUUID(),
            contract_id: id,
            ordinal: 1,
            title: "Full Project Delivery",
            amount_etb: data.total_amount_etb,
            due_days: 7,
            status: "funded",
            created_at: now,
            updated_at: now,
          },
        ];

    const newContract: Contract = {
      ...data,
      id,
      milestones,
      created_at: now,
      updated_at: now,
    };

    store.contracts.unshift(newContract);
    writeStore(store);
    return newContract;
  }

  async updateStatus(
    id: string,
    status: EscrowStatus,
    extras?: Partial<Contract>
  ): Promise<Contract> {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === id);
    if (!contract) throw new Error("Contract not found");

    contract.escrow_status = status;
    contract.updated_at = new Date().toISOString();
    if (extras) Object.assign(contract, extras);

    writeStore(store);
    return contract;
  }

  async submitWork(id: string, submissionUrl: string, notes?: string): Promise<Contract> {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === id);
    if (!contract) throw new Error("Contract not found");

    contract.escrow_status = "work_submitted";
    contract.work_submission_url = submissionUrl;
    contract.work_submission_notes = notes || null;
    contract.updated_at = new Date().toISOString();

    writeStore(store);
    return contract;
  }

  async requestRevision(id: string, notes: string): Promise<Contract> {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === id);
    if (!contract) throw new Error("Contract not found");

    contract.escrow_status = "funded";
    contract.revision_requested = true;
    contract.revision_notes = notes;
    if (contract.revisions_remaining && contract.revisions_remaining > 0) {
      contract.revisions_remaining -= 1;
    }
    contract.updated_at = new Date().toISOString();

    writeStore(store);
    return contract;
  }

  async getMilestones(contractId: string): Promise<Milestone[]> {
    const store = readStore();
    const contract = store.contracts.find((c) => c.id === contractId);
    return contract?.milestones || [];
  }

  async updateMilestoneStatus(
    milestoneId: string,
    status: MilestoneStatus,
    extras?: Partial<Milestone>
  ): Promise<Milestone> {
    const store = readStore();
    for (const contract of store.contracts) {
      const milestone = contract.milestones?.find((m) => m.id === milestoneId);
      if (milestone) {
        milestone.status = status;
        milestone.updated_at = new Date().toISOString();
        if (extras) Object.assign(milestone, extras);
        writeStore(store);
        return milestone;
      }
    }
    throw new Error("Milestone not found");
  }
}

export class DemoJobRepository implements IJobRepository {
  async findById(id: string): Promise<Job | null> {
    const store = readStore();
    const job = store.jobs.find((j) => j.id === id);
    if (!job) return null;
    const client = store.users.find((u) => u.id === job.client_id)?.profile;
    return {
      ...job,
      profiles: client
        ? { full_name: client.full_name, is_verified: client.is_verified, rating: client.rating, created_at: client.created_at }
        : undefined,
    };
  }

  async findOpen(category?: string): Promise<Job[]> {
    const store = readStore();
    return store.jobs
      .filter((j) => j.status === "open" && (!category || j.category === category))
      .map((j) => {
        const client = store.users.find((u) => u.id === j.client_id)?.profile;
        return {
          ...j,
          profiles: client
            ? { full_name: client.full_name, is_verified: client.is_verified, rating: client.rating, created_at: client.created_at }
            : undefined,
        };
      });
  }

  async findByClient(clientId: string): Promise<Job[]> {
    const store = readStore();
    return store.jobs.filter((j) => j.client_id === clientId);
  }

  async create(data: Omit<Job, "id" | "created_at">): Promise<Job> {
    const store = readStore();
    const job: Job = {
      ...data,
      id: randomUUID(),
      created_at: new Date().toISOString(),
    };
    store.jobs.unshift(job);
    writeStore(store);
    return job;
  }

  async update(id: string, updates: Partial<Job>): Promise<Job> {
    const store = readStore();
    const job = store.jobs.find((j) => j.id === id);
    if (!job) throw new Error("Job not found");
    Object.assign(job, updates);
    writeStore(store);
    return job;
  }

  async delete(id: string): Promise<boolean> {
    const store = readStore();
    const idx = store.jobs.findIndex((j) => j.id === id);
    if (idx === -1) return false;
    store.jobs.splice(idx, 1);
    writeStore(store);
    return true;
  }
}

export class DemoProposalRepository implements IProposalRepository {
  async findById(id: string): Promise<Proposal | null> {
    const store = readStore();
    const proposal = store.proposals.find((p) => p.id === id);
    if (!proposal) return null;
    const freelancer = store.users.find((u) => u.id === proposal.freelancer_id)?.profile;
    const job = store.jobs.find((j) => j.id === proposal.job_id);
    return {
      ...proposal,
      profiles: freelancer
        ? {
            full_name: freelancer.full_name,
            rating: freelancer.rating,
            is_verified: freelancer.is_verified,
            skills: freelancer.skills,
          }
        : undefined,
      jobs: job
        ? {
            title: job.title,
            budget_etb: job.budget_etb,
            client_id: job.client_id,
            status: job.status,
          }
        : undefined,
    };
  }

  async findByJob(jobId: string): Promise<Proposal[]> {
    const store = readStore();
    return store.proposals
      .filter((p) => p.job_id === jobId)
      .map((p) => {
        const freelancer = store.users.find((u) => u.id === p.freelancer_id)?.profile;
        return {
          ...p,
          profiles: freelancer
            ? {
                full_name: freelancer.full_name,
                rating: freelancer.rating,
                is_verified: freelancer.is_verified,
                skills: freelancer.skills,
              }
            : undefined,
        };
      });
  }

  async findByFreelancer(freelancerId: string): Promise<Proposal[]> {
    const store = readStore();
    return store.proposals
      .filter((p) => p.freelancer_id === freelancerId)
      .map((p) => {
        const job = store.jobs.find((j) => j.id === p.job_id);
        return {
          ...p,
          jobs: job
            ? {
                title: job.title,
                budget_etb: job.budget_etb,
                client_id: job.client_id,
                status: job.status,
              }
            : undefined,
        };
      });
  }

  async create(data: Omit<Proposal, "id" | "created_at">): Promise<Proposal> {
    const store = readStore();
    const proposal: Proposal = {
      ...data,
      id: randomUUID(),
      created_at: new Date().toISOString(),
    };
    store.proposals.unshift(proposal);
    writeStore(store);
    return proposal;
  }

  async updateStatus(id: string, status: ProposalStatus): Promise<Proposal> {
    const store = readStore();
    const proposal = store.proposals.find((p) => p.id === id);
    if (!proposal) throw new Error("Proposal not found");
    proposal.status = status;
    writeStore(store);
    return proposal;
  }
}

export class DemoGigRepository implements IGigRepository {
  async findPublished(category?: string, query?: string): Promise<Gig[]> {
    const store = readStore();
    return store.gigs
      .filter((g) => {
        if (g.is_published === false) return false;
        if (category && g.category !== category) return false;
        if (query) {
          const q = query.toLowerCase();
          return (
            g.title.toLowerCase().includes(q) ||
            g.description.toLowerCase().includes(q) ||
            g.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .map((g) => {
        const freelancer = store.users.find((u) => u.id === g.freelancer_id)?.profile;
        return { ...g, freelancer };
      });
  }

  async findById(id: string): Promise<Gig | null> {
    const store = readStore();
    const gig = store.gigs.find((g) => g.id === id || g.slug === id);
    if (!gig) return null;
    const freelancer = store.users.find((u) => u.id === gig.freelancer_id)?.profile;
    return { ...gig, freelancer };
  }

  async findByFreelancer(freelancerId: string): Promise<Gig[]> {
    const store = readStore();
    return store.gigs.filter((g) => g.freelancer_id === freelancerId);
  }

  async create(
    data: Omit<Gig, "id" | "created_at" | "rating" | "reviews_count" | "orders_completed">
  ): Promise<Gig> {
    const store = readStore();
    const gig: Gig = {
      ...data,
      id: randomUUID(),
      rating: 5.0,
      reviews_count: 0,
      orders_completed: 0,
      created_at: new Date().toISOString(),
    };
    store.gigs.unshift(gig);
    writeStore(store);
    return gig;
  }

  async update(id: string, updates: Partial<Gig>): Promise<Gig> {
    const store = readStore();
    const gig = store.gigs.find((g) => g.id === id);
    if (!gig) throw new Error("Gig not found");
    Object.assign(gig, updates);
    writeStore(store);
    return gig;
  }

  async delete(id: string): Promise<boolean> {
    const store = readStore();
    const idx = store.gigs.findIndex((g) => g.id === id);
    if (idx === -1) return false;
    store.gigs.splice(idx, 1);
    writeStore(store);
    return true;
  }
}

export class DemoProfileRepository implements IProfileRepository {
  async findById(id: string): Promise<Profile | null> {
    const store = readStore();
    const user = store.users.find((u) => u.id === id);
    return user ? user.profile : null;
  }

  async update(id: string, updates: Partial<Profile>): Promise<Profile> {
    const store = readStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) throw new Error("Profile not found");
    Object.assign(user.profile, updates);
    writeStore(store);
    return user.profile;
  }

  async searchSpecialists(skills?: string[], minRating?: number): Promise<Profile[]> {
    const store = readStore();
    return store.users
      .filter((u) => u.profile.role === "freelancer")
      .map((u) => u.profile)
      .filter((p) => {
        if (minRating && p.rating < minRating) return false;
        if (skills && skills.length > 0) {
          const hasSkill = skills.some((s) =>
            p.skills.map((ps) => ps.toLowerCase()).includes(s.toLowerCase())
          );
          if (!hasSkill) return false;
        }
        return true;
      });
  }
}
