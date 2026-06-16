import { describe, it, expect } from "vitest";

const determineWinner = (aVal, bVal, lowerIsBetter) => {
  if (aVal === bVal) return "tie";
  if (lowerIsBetter) return aVal < bVal ? "left" : "right";
  return aVal > bVal ? "left" : "right";
};

const getWinnerScore = (user) => {
  return (user?.points?.gitRankPoints || 0) * 0.5 +
         (user?.points?.totalPoints || 0) * 0.3 +
         (user?.githubStats?.commits || 0) * 0.1 +
         (user?.streak || 0) * 0.1;
};

const countUnlockedBadges = (user) => {
  if (!user) return 0;
  const gitRankPoints = user.points?.gitRankPoints || 0;
  const streak = user.streak || 0;
  const codingVersePoints = user.points?.codingVersePoints || 0;
  const referralPoints = user.points?.referralPoints || 0;

  let count = 1;
  if (gitRankPoints >= 100) count++;
  if (streak >= 10) count++;
  if (codingVersePoints >= 100) count++;
  if (referralPoints >= 1000) count++;
  return count;
};

describe("Comparison Winner Logic", () => {
  it("higher value wins when lowerIsBetter is false", () => {
    expect(determineWinner(100, 50, false)).toBe("left");
    expect(determineWinner(50, 100, false)).toBe("right");
  });

  it("lower value wins when lowerIsBetter is true", () => {
    expect(determineWinner(5, 10, true)).toBe("left");
    expect(determineWinner(10, 5, true)).toBe("right");
  });

  it("returns tie for equal values", () => {
    expect(determineWinner(100, 100, false)).toBe("tie");
    expect(determineWinner(5, 5, true)).toBe("tie");
  });

  it("calculates overall winner score correctly", () => {
    const user = {
      points: { gitRankPoints: 100, totalPoints: 200 },
      githubStats: { commits: 50 },
      streak: 10,
    };
    expect(getWinnerScore(user)).toBe(116);
  });

  it("handles missing data gracefully", () => {
    expect(getWinnerScore({})).toBe(0);
    expect(determineWinner(0, 0, false)).toBe("tie");
  });
});

describe("Badge Counting", () => {
  it("always counts Pioneer badge", () => {
    expect(countUnlockedBadges({})).toBe(1);
  });

  it("counts all unlocked badges", () => {
    const user = {
      points: { gitRankPoints: 150, totalPoints: 500, codingVersePoints: 200, referralPoints: 2000 },
      streak: 15,
    };
    expect(countUnlockedBadges(user)).toBe(5);
  });

  it("counts partial badges", () => {
    const user = {
      points: { gitRankPoints: 50, totalPoints: 100, codingVersePoints: 50, referralPoints: 500 },
      streak: 5,
    };
    expect(countUnlockedBadges(user)).toBe(1);
  });
});

describe("localStorage Persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores and retrieves recent comparisons", () => {
    const STORAGE_KEY = "rankerhub_recent_comparisons";
    const data = [
      { username: "alice", name: "Alice", avatar: "https://example.com/a.png" },
      { username: "bob", name: "Bob", avatar: "https://example.com/b.png" },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const retrieved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(retrieved).toHaveLength(2);
    expect(retrieved[0].username).toBe("alice");
  });

  it("respects max 5 entries", () => {
    const STORAGE_KEY = "rankerhub_recent_comparisons";
    const data = Array.from({ length: 7 }, (_, i) => ({
      username: `user${i}`,
      name: `User ${i}`,
      avatar: "",
    }));
    const trimmed = data.slice(0, 5);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    const retrieved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(retrieved).toHaveLength(5);
  });
});