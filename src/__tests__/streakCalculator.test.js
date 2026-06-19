import { describe, it, expect } from "vitest";
import {
  toLocalDateString,
  addDaysToDateString,
  calculateGithubStreak,
  evaluateLoginStreak,
  evaluateCodingVerseStreak,
} from "../utils/streakCalculator";

describe("toLocalDateString", () => {
  it("maps UTC timestamps to the correct local calendar day", () => {
    // Jan 1 11:55 PM Pacific = Jan 2 07:55 UTC
    expect(toLocalDateString("2026-01-02T07:55:00Z", "America/Los_Angeles")).toBe(
      "2026-01-01"
    );
  });

  it("maps late-night Asia/Kolkata contributions to the local day", () => {
    // 11:55 PM IST on June 1 = 18:25 UTC on June 1
    expect(toLocalDateString("2026-06-01T18:25:00Z", "Asia/Kolkata")).toBe(
      "2026-06-01"
    );
  });

  it("maps early-morning IST contributions that fall on the prior UTC day", () => {
    // 2:00 AM IST on June 2 = 20:30 UTC on June 1
    expect(toLocalDateString("2026-06-01T20:30:00Z", "Asia/Kolkata")).toBe(
      "2026-06-02"
    );
  });
});

describe("calculateGithubStreak", () => {
  it("counts consecutive local days instead of UTC days", () => {
    const events = [
      "2026-01-02T07:55:00Z", // Jan 1 local (America/Los_Angeles)
      "2026-01-02T16:00:00Z", // Jan 2 local morning
    ];
    const referenceDate = new Date("2026-01-02T20:00:00Z"); // Jan 2 local

    expect(calculateGithubStreak(events, "America/Los_Angeles", referenceDate)).toBe(
      2
    );
    // UTC-only grouping would treat both events as Jan 2 → streak of 1
    expect(calculateGithubStreak(events, "UTC", referenceDate)).toBe(1);
  });

  it("preserves streak when user contributed yesterday in local time", () => {
    const events = ["2026-06-01T18:25:00Z"]; // June 1 11:55 PM IST
    const referenceDate = new Date("2026-06-02T10:00:00Z"); // June 2 afternoon IST

    expect(calculateGithubStreak(events, "Asia/Kolkata", referenceDate)).toBe(1);
  });

  it("returns 0 when there is no activity today or yesterday locally", () => {
    const events = ["2026-06-01T10:00:00Z"];
    const referenceDate = new Date("2026-06-03T10:00:00Z");

    expect(calculateGithubStreak(events, "Asia/Kolkata", referenceDate)).toBe(0);
  });

  it("handles leap year boundaries", () => {
    const events = ["2024-02-28T12:00:00Z", "2024-02-29T12:00:00Z"];
    const referenceDate = new Date("2024-02-29T18:00:00Z");

    expect(calculateGithubStreak(events, "UTC", referenceDate)).toBe(2);
  });
});

describe("evaluateLoginStreak", () => {
  it("increments streak for consecutive local calendar days", () => {
    const result = evaluateLoginStreak(
      "2026-06-01T10:00:00+05:30",
      "2026-06-02T10:00:00+05:30",
      5,
      "Asia/Kolkata"
    );
    expect(result.streak).toBe(6);
    expect(result.updated).toBe(true);
  });

  it("resets streak when a local day is missed", () => {
    const result = evaluateLoginStreak(
      "2026-06-01T10:00:00Z",
      "2026-06-03T10:00:00Z",
      5,
      "UTC"
    );
    expect(result.streak).toBe(1);
    expect(result.updated).toBe(true);
  });

  it("does not update streak for multiple logins on the same local day", () => {
    const result = evaluateLoginStreak(
      "2026-06-01T08:00:00Z",
      "2026-06-01T18:00:00Z",
      5,
      "UTC"
    );
    expect(result.streak).toBe(5);
    expect(result.updated).toBe(false);
  });

  it("treats logins on the same local Pacific day as one day", () => {
    const result = evaluateLoginStreak(
      "2026-01-02T07:55:00Z", // Jan 1 11:55 PM Pacific
      "2026-01-02T07:59:00Z", // Jan 1 11:59 PM Pacific
      3,
      "America/Los_Angeles"
    );
    expect(result.streak).toBe(3);
    expect(result.updated).toBe(false);
  });

  it("counts cross-midnight local logins as consecutive days", () => {
    const result = evaluateLoginStreak(
      "2026-01-02T07:55:00Z", // Jan 1 11:55 PM Pacific
      "2026-01-02T16:00:00Z", // Jan 2 8:00 AM Pacific
      1,
      "America/Los_Angeles"
    );
    expect(result.streak).toBe(2);
    expect(result.updated).toBe(true);
  });
});

describe("evaluateCodingVerseStreak", () => {
  it("starts a new streak on first solve day", () => {
    const result = evaluateCodingVerseStreak(null, 0, "UTC", new Date("2026-06-01T12:00:00Z"));
    expect(result).toEqual({
      streak: 1,
      lastSolveDate: "2026-06-01",
      earnedStreakPoints: 5,
      progressed: true,
    });
  });

  it("extends streak across local day boundaries", () => {
    const result = evaluateCodingVerseStreak(
      "2026-01-01",
      2,
      "America/Los_Angeles",
      new Date("2026-01-02T16:00:00Z")
    );
    expect(result.streak).toBe(3);
    expect(result.lastSolveDate).toBe("2026-01-02");
    expect(result.progressed).toBe(true);
  });

  it("does not progress when already solved today locally", () => {
    const result = evaluateCodingVerseStreak(
      "2026-06-01",
      4,
      "Asia/Kolkata",
      new Date("2026-06-01T12:00:00Z") // still June 1 in IST
    );
    expect(result.streak).toBe(4);
    expect(result.earnedStreakPoints).toBe(0);
    expect(result.progressed).toBe(false);
  });
});

describe("addDaysToDateString", () => {
  it("steps backward across month boundaries", () => {
    expect(addDaysToDateString("2026-03-01", -1)).toBe("2026-02-28");
  });
});
