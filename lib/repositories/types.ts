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

export interface IContractRepository {
  findById(id: string): Promise<Contract | null>;
  findByUser(userId: string): Promise<Contract[]>;
  createContract(
    data: Omit<Contract, "id" | "created_at" | "updated_at">,
    milestonesData?: Array<Omit<Milestone, "id" | "contract_id" | "created_at" | "updated_at">>
  ): Promise<Contract>;
  updateStatus(
    id: string,
    status: EscrowStatus,
    extras?: Partial<Contract>
  ): Promise<Contract>;
  submitWork(id: string, submissionUrl: string, notes?: string): Promise<Contract>;
  requestRevision(id: string, notes: string): Promise<Contract>;
  getMilestones(contractId: string): Promise<Milestone[]>;
  updateMilestoneStatus(
    milestoneId: string,
    status: MilestoneStatus,
    extras?: Partial<Milestone>
  ): Promise<Milestone>;
}

export interface IJobRepository {
  findById(id: string): Promise<Job | null>;
  findOpen(category?: string): Promise<Job[]>;
  findByClient(clientId: string): Promise<Job[]>;
  create(data: Omit<Job, "id" | "created_at">): Promise<Job>;
  update(id: string, updates: Partial<Job>): Promise<Job>;
  delete(id: string): Promise<boolean>;
}

export interface IProposalRepository {
  findById(id: string): Promise<Proposal | null>;
  findByJob(jobId: string): Promise<Proposal[]>;
  findByFreelancer(freelancerId: string): Promise<Proposal[]>;
  create(data: Omit<Proposal, "id" | "created_at">): Promise<Proposal>;
  updateStatus(id: string, status: ProposalStatus): Promise<Proposal>;
}

export interface IGigRepository {
  findPublished(category?: string, query?: string): Promise<Gig[]>;
  findById(id: string): Promise<Gig | null>;
  findByFreelancer(freelancerId: string): Promise<Gig[]>;
  create(
    data: Omit<Gig, "id" | "created_at" | "rating" | "reviews_count" | "orders_completed">
  ): Promise<Gig>;
  update(id: string, updates: Partial<Gig>): Promise<Gig>;
  delete(id: string): Promise<boolean>;
}

export interface IProfileRepository {
  findById(id: string): Promise<Profile | null>;
  update(id: string, updates: Partial<Profile>): Promise<Profile>;
  searchSpecialists(skills?: string[], minRating?: number): Promise<Profile[]>;
}
