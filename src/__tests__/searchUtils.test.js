import { describe, it, expect, vi } from "vitest";
import {
  searchLeaderboard,
  filterByLanguage,
  filterByRole,
  getSearchSuggestions,
} from "../utils/searchUtils";

// Mock the leaderboard data modules since they are empty in main
vi.mock("../data/leaderboard", () => {
  return {
    leaderboardData: [
      {
        name: "Alice Smith",
        username: "alice",
        role: "Frontend Developer",
        language: "JavaScript",
      },
      {
        name: "Bob Johnson",
        username: "bob",
        role: "Backend Developer",
        language: "Python",
      },
    ],
    womenLeaderboardData: [
      {
        name: "Clara Davis",
        username: "clara",
        role: "Engineering Lead",
        language: "Go",
      },
    ],
  };
});

describe("searchUtils", () => {
  describe("searchLeaderboard", () => {
    it("should return matches from leaderboardData", () => {
      const results = searchLeaderboard("alice");
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Alice Smith");
    });

    it("should include womenLeaderboardData if requested", () => {
      const results = searchLeaderboard("clara", true);
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Clara Davis");
    });

    it("should be null-safe when user fields are missing", () => {
      // Temporarily mock the module data for testing incomplete data
      vi.doMock("../data/leaderboard", () => {
        return {
          leaderboardData: [
            { name: null, username: "usernameonly", role: "Dev" },
            { name: "NoUsername", username: undefined, role: "Dev" },
          ],
          womenLeaderboardData: [],
        };
      });

      // It should execute without throwing type errors
      expect(() => searchLeaderboard("username")).not.toThrow();
      expect(() => searchLeaderboard("no")).not.toThrow();
    });
  });

  describe("getSearchSuggestions", () => {
    const users = [
      { name: "Alice Smith", username: "alice" },
      { name: "Bob Jones", username: "bob" },
      { name: undefined, username: "guest123" },
      { name: "Guest User", username: null },
    ];

    it("should generate suggestions based on partial input", () => {
      const suggestions = getSearchSuggestions(users, "al");
      expect(suggestions.length).toBe(2);
      expect(suggestions[0].value).toBe("Alice Smith");
      expect(suggestions[1].value).toBe("alice");
    });

    it("should be null-safe and skip missing fields without crashing", () => {
      expect(() => getSearchSuggestions(users, "guest")).not.toThrow();
      const suggestions = getSearchSuggestions(users, "guest");
      // Guest User match
      expect(suggestions.some((s) => s.value === "Guest User")).toBe(true);
    });

    it("should prevent duplicate suggestions when multiple users match the same suggestion value", () => {
      const usersWithDupes = [
        { name: "Alice Smith", username: "alice", language: "JavaScript" },
        { name: "Alice Smith", username: "alice2", language: "JavaScript" },
        { name: "Bob Jones", username: "bob", language: "Python" },
      ];
      // Search for language "JavaScript" where multiple users have it
      const suggestions = getSearchSuggestions(usersWithDupes, "java");
      const jsSuggestions = suggestions.filter((s) => s.type === "language");
      expect(jsSuggestions.length).toBe(1);
      expect(jsSuggestions[0].value).toBe("JavaScript");

      // Search for name "Alice Smith" where multiple users share the name
      const nameSuggestions = getSearchSuggestions(usersWithDupes, "alice");
      const nameMatches = nameSuggestions.filter((s) => s.type === "name");
      expect(nameMatches.length).toBe(1);
      expect(nameMatches[0].display).toBe("Alice Smith (@alice)"); // First occurrence is preserved
    });
  });

  describe("filterByLanguage and filterByRole", () => {
    const users = [
      { name: "Alice", language: "JavaScript", role: "Frontend" },
      { name: "Bob", language: "Python", role: "Backend" },
    ];

    it("should filter by language", () => {
      const jsUsers = filterByLanguage(users, "JavaScript");
      expect(jsUsers.length).toBe(1);
      expect(jsUsers[0].name).toBe("Alice");
    });

    it("should filter by role", () => {
      const backendUsers = filterByRole(users, "backend");
      expect(backendUsers.length).toBe(1);
      expect(backendUsers[0].name).toBe("Bob");
    });
  });
});
