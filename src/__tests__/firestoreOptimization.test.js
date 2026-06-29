import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FirestoreCache } from "../utils/firestoreOptimization";

describe("FirestoreCache", () => {
  let cache;

  beforeEach(() => {
    cache = new FirestoreCache(1000); // 1 second TTL
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should store and retrieve data correctly", () => {
    const data = { name: "Alice", role: "Developer" };
    cache.set("users/123", data);

    expect(cache.get("users/123")).toEqual(data);
  });

  it("should return null for expired documents", () => {
    const data = { name: "Bob" };
    cache.set("users/456", data);

    // Fast-forward time past 1 second TTL
    vi.advanceTimersByTime(1500);

    expect(cache.get("users/456")).toBeNull();
  });

  it("should merge fields correctly inside data wrapper on update", () => {
    const originalData = { name: "Charlie", score: 10, skills: ["JS"] };
    cache.set("users/789", originalData);

    // Update specific fields
    cache.update("users/789", { score: 20, active: true });

    const cachedEntry = cache.cache.get("users/789");
    // Verify cache entry structure is preserved (data wrapper + timestamp)
    expect(cachedEntry).toHaveProperty("data");
    expect(cachedEntry).toHaveProperty("timestamp");
    expect(cachedEntry.timestamp).toBeTypeOf("number");

    // Verify underlying data was merged properly
    expect(cachedEntry.data).toEqual({
      name: "Charlie",
      score: 20,
      skills: ["JS"],
      active: true,
    });

    // Verify retrieval
    expect(cache.get("users/789")).toEqual({
      name: "Charlie",
      score: 20,
      skills: ["JS"],
      active: true,
    });
  });

  it("should delete entry", () => {
    cache.set("users/123", { val: 1 });
    cache.delete("users/123");
    expect(cache.get("users/123")).toBeNull();
  });

  it("should clear all entries", () => {
    cache.set("a", { val: 1 });
    cache.set("b", { val: 2 });
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
