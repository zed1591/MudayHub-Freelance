import { isDemoMode } from "@/lib/demo/mode";
import {
  DemoContractRepository,
  DemoGigRepository,
  DemoJobRepository,
  DemoProfileRepository,
  DemoProposalRepository,
} from "./demo";
import {
  SupabaseContractRepository,
  SupabaseGigRepository,
  SupabaseJobRepository,
  SupabaseProfileRepository,
  SupabaseProposalRepository,
} from "./supabase";
import type {
  IContractRepository,
  IGigRepository,
  IJobRepository,
  IProfileRepository,
  IProposalRepository,
} from "./types";

export function getContractRepository(): IContractRepository {
  return isDemoMode() ? new DemoContractRepository() : new SupabaseContractRepository();
}

export function getJobRepository(): IJobRepository {
  return isDemoMode() ? new DemoJobRepository() : new SupabaseJobRepository();
}

export function getProposalRepository(): IProposalRepository {
  return isDemoMode() ? new DemoProposalRepository() : new SupabaseProposalRepository();
}

export function getGigRepository(): IGigRepository {
  return isDemoMode() ? new DemoGigRepository() : new SupabaseGigRepository();
}

export function getProfileRepository(): IProfileRepository {
  return isDemoMode() ? new DemoProfileRepository() : new SupabaseProfileRepository();
}

export * from "./types";
