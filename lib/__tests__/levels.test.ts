import { describe, expect, it } from "vitest";
import { computeFreelancerLevel } from "../levels";

describe("Freelancer Reputation & Leveling System", () => {
  it("defaults to New Talent for 0 completed contracts", () => {
    const lvl = computeFreelancerLevel(5.0, 0);
    expect(lvl.id).toBe("new");
    expect(lvl.levelNumber).toBe(0);
    expect(lvl.badgeLabel).toBe("New Talent");
  });

  it("advances to Level 1 Verified Specialist after 1 completed contract", () => {
    const lvl = computeFreelancerLevel(4.2, 1);
    expect(lvl.id).toBe("verified");
    expect(lvl.levelNumber).toBe(1);
    expect(lvl.badgeLabel).toBe("Level 1 Specialist");
  });

  it("advances to Rising Talent with 2+ completed and 4.5+ rating", () => {
    const lvl = computeFreelancerLevel(4.6, 2);
    expect(lvl.id).toBe("rising");
    expect(lvl.levelNumber).toBe(2);
    expect(lvl.badgeLabel).toBe("Rising Talent");
  });

  it("advances to Top Rated with 5+ completed and 4.75+ rating", () => {
    const lvl = computeFreelancerLevel(4.9, 5);
    expect(lvl.id).toBe("top_rated");
    expect(lvl.levelNumber).toBe(3);
    expect(lvl.badgeLabel).toBe("Top Rated");
  });

  it("advances to Muday Master with 10+ completed and 4.85+ rating", () => {
    const lvl = computeFreelancerLevel(4.95, 12);
    expect(lvl.id).toBe("master");
    expect(lvl.levelNumber).toBe(4);
    expect(lvl.badgeLabel).toBe("Muday Master");
    expect(lvl.progressPercent).toBe(100);
  });
});
