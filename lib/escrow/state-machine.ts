import type { EscrowStatus, MilestoneStatus } from "@/lib/types";

const TRANSITIONS: Record<EscrowStatus, EscrowStatus[]> = {
  awaiting_deposit: ["funded", "refunded"],
  funded: ["work_submitted", "disputed"],
  work_submitted: ["completed", "disputed", "funded"],
  disputed: ["completed", "refunded"],
  completed: [],
  refunded: [],
};

const MILESTONE_TRANSITIONS: Record<MilestoneStatus, MilestoneStatus[]> = {
  locked: ["funded"],
  funded: ["work_submitted", "disputed"],
  work_submitted: ["completed", "disputed", "funded"],
  disputed: ["completed", "refunded"],
  completed: [],
  refunded: [],
};

export function canTransition(from: EscrowStatus, to: EscrowStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: EscrowStatus, to: EscrowStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid escrow transition: ${from} → ${to}`);
  }
}

export function canMilestoneTransition(from: MilestoneStatus, to: MilestoneStatus): boolean {
  return MILESTONE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertMilestoneTransition(from: MilestoneStatus, to: MilestoneStatus): void {
  if (!canMilestoneTransition(from, to)) {
    throw new Error(`Invalid milestone transition: ${from} → ${to}`);
  }
}

export const STEPPER_STEPS = [
  { key: "awaiting_deposit", label: "Deposit Funds" },
  { key: "funded", label: "In Progress (Protected)" },
  { key: "work_submitted", label: "Work Review" },
  { key: "completed", label: "Released to Telebirr" },
] as const;

export function stepperIndex(status: EscrowStatus): number {
  if (status === "disputed" || status === "refunded") return -1;
  const map: Record<string, number> = {
    awaiting_deposit: 0,
    funded: 1,
    work_submitted: 2,
    completed: 3,
  };
  return map[status] ?? 0;
}

