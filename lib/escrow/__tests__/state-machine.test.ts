import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  canMilestoneTransition,
  assertMilestoneTransition,
  stepperIndex,
} from "../state-machine";

describe("Escrow State Machine", () => {
  it("allows legal contract state transitions", () => {
    expect(canTransition("awaiting_deposit", "funded")).toBe(true);
    expect(canTransition("funded", "work_submitted")).toBe(true);
    expect(canTransition("work_submitted", "completed")).toBe(true);
    expect(canTransition("work_submitted", "funded")).toBe(true); // revision requested
    expect(canTransition("work_submitted", "disputed")).toBe(true);
    expect(canTransition("disputed", "completed")).toBe(true);
    expect(canTransition("disputed", "refunded")).toBe(true);
  });

  it("rejects illegal contract state transitions", () => {
    expect(canTransition("awaiting_deposit", "completed")).toBe(false);
    expect(canTransition("completed", "funded")).toBe(false);
    expect(canTransition("refunded", "work_submitted")).toBe(false);
    expect(() => assertTransition("awaiting_deposit", "completed")).toThrow(
      "Invalid escrow transition"
    );
  });

  it("calculates correct stepper indices", () => {
    expect(stepperIndex("awaiting_deposit")).toBe(0);
    expect(stepperIndex("funded")).toBe(1);
    expect(stepperIndex("work_submitted")).toBe(2);
    expect(stepperIndex("completed")).toBe(3);
    expect(stepperIndex("disputed")).toBe(-1);
    expect(stepperIndex("refunded")).toBe(-1);
  });
});

describe("Milestone State Machine", () => {
  it("allows legal milestone transitions", () => {
    expect(canMilestoneTransition("locked", "funded")).toBe(true);
    expect(canMilestoneTransition("funded", "work_submitted")).toBe(true);
    expect(canMilestoneTransition("work_submitted", "completed")).toBe(true);
    expect(canMilestoneTransition("work_submitted", "funded")).toBe(true); // revision
    expect(canMilestoneTransition("disputed", "refunded")).toBe(true);
  });

  it("rejects illegal milestone transitions", () => {
    expect(canMilestoneTransition("locked", "completed")).toBe(false);
    expect(() => assertMilestoneTransition("locked", "completed")).toThrow(
      "Invalid milestone transition"
    );
  });
});
