import { describe, it, expect } from "vitest";

// Core logic wrappers for testing
const calculateGitRank = (commits, prs, reviews) =>
  commits * 2 + prs * 5 + reviews * 10;
const calculateTotalPoints = (gitRank, codingVerse, streak, referral) =>
  (gitRank || 0) + (codingVerse || 0) + (streak || 0) + (referral || 0);
const applyXpCap = (oldPoints, newPoints) =>
  newPoints - oldPoints > 200 ? oldPoints + 200 : newPoints;

describe("Points Engine Logic", () => {
  it("should calculate GitRank correctly for standard activity", () => {
    expect(calculateGitRank(10, 2, 1)).toBe(40); // 20 + 10 + 10
  });

  it("should return 0 GitRank when there is no activity", () => {
    expect(calculateGitRank(0, 0, 0)).toBe(0);
  });

  it("should accurately calculate GitRank for heavy open-source contributors", () => {
    expect(calculateGitRank(100, 50, 25)).toBe(700); // 200 + 250 + 250
  });

  it("should aggregate totalPoints from all four point buckets correctly", () => {
    expect(calculateTotalPoints(100, 50, 20, 200)).toBe(370);
  });

  it("should aggregate totalPoints safely even if some buckets are null or undefined", () => {
    expect(calculateTotalPoints(100, null, undefined, 50)).toBe(150);
  });

  it("should allow points update if the increment is exactly at the 200 XP cap limit", () => {
    expect(applyXpCap(1000, 1200)).toBe(1200);
  });

  it("should strictly enforce the +200 XP maximum cap per request", () => {
    expect(applyXpCap(1000, 1500)).toBe(1200); // Attempted +500, capped at +200
  });

  it("should handle negative point differentials safely (no penalty applied during cap check)", () => {
    expect(applyXpCap(100, 50)).toBe(50);
  });
});
