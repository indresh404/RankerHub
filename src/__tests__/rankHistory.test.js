import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveRankSnapshot, getRankHistory } from "../services/rankHistoryService";
import * as firestoreSdk from "firebase/firestore";

// Mock firebase/firestore
vi.mock("firebase/firestore", () => {
  return {
    doc: vi.fn(),
    setDoc: vi.fn(),
    getDocs: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn()
  };
});

// Mock database
vi.mock("../lib/firebase", () => {
  return {
    db: {}
  };
});

// Mock streakCalculator functions
vi.mock("../utils/streakCalculator", () => {
  return {
    toLocalDateString: vi.fn(() => "2026-06-15"),
    resolveTimezone: vi.fn(() => "UTC")
  };
});

describe("rankHistoryService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveRankSnapshot", () => {
    it("should parse rank, format date and write snapshot to firestore", async () => {
      const mockDocRef = {};
      firestoreSdk.doc.mockReturnValue(mockDocRef);
      firestoreSdk.setDoc.mockResolvedValue();

      await saveRankSnapshot("user123", "#42", 1200, "UTC");

      expect(firestoreSdk.doc).toHaveBeenCalledWith(
        expect.anything(),
        "users",
        "user123",
        "rankHistory",
        "2026-06-15"
      );
      expect(firestoreSdk.setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          rank: 42,
          totalPoints: 1200,
          date: "2026-06-15"
        }),
        { merge: true }
      );
    });

    it("should ignore invalid/loading ranks", async () => {
      await saveRankSnapshot("user123", "Loading...", 1200, "UTC");
      expect(firestoreSdk.setDoc).not.toHaveBeenCalled();
    });
  });

  describe("getRankHistory", () => {
    it("should fetch snapshots and sort them", async () => {
      const mockSnapshots = [
        { data: () => ({ rank: 40, totalPoints: 1200, date: "2026-06-15" }) },
        { data: () => ({ rank: 42, totalPoints: 1150, date: "2026-06-14" }) }
      ];
      firestoreSdk.getDocs.mockResolvedValue(mockSnapshots);

      const history = await getRankHistory("user123");

      expect(firestoreSdk.collection).toHaveBeenCalledWith(expect.anything(), "users", "user123", "rankHistory");
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({ rank: 40, totalPoints: 1200, date: "2026-06-15" });
    });
  });
});
