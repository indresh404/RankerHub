import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { FirestoreBatchOptimizer } from "../utils/firestoreOptimization";
import * as firestoreSdk from "firebase/firestore";

// Mock firebase/firestore
vi.mock("firebase/firestore", () => {
  return {
    writeBatch: vi.fn(),
  };
});

// Mock database
vi.mock("../lib/firebase", () => {
  return {
    db: {},
  };
});

describe("FirestoreBatchOptimizer", () => {
  let mockBatch;

  beforeEach(() => {
    mockBatch = {
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(),
    };
    firestoreSdk.writeBatch.mockReturnValue(mockBatch);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should delay flushing based on interval", async () => {
    const optimizer = new FirestoreBatchOptimizer(500, 5);
    optimizer.add({ type: "set", docRef: "ref1", data: { x: 1 } });

    // Shouldn't flush immediately
    expect(optimizer.batch.length).toBe(1);
    expect(mockBatch.commit).not.toHaveBeenCalled();

    // Advance timer past 500ms
    vi.advanceTimersByTime(600);

    // Verify flush was called
    expect(optimizer.batch.length).toBe(0);
    expect(mockBatch.set).toHaveBeenCalledWith("ref1", { x: 1 }, undefined);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("should flush immediately when maxBatchSize is reached", () => {
    const optimizer = new FirestoreBatchOptimizer(1000, 3);
    optimizer.add({ type: "set", docRef: "r1", data: { v: 1 } });
    optimizer.add({ type: "update", docRef: "r2", data: { v: 2 } });

    expect(optimizer.batch.length).toBe(2);
    expect(mockBatch.commit).not.toHaveBeenCalled();

    // The third one should trigger immediate flush
    optimizer.add({ type: "delete", docRef: "r3" });

    expect(optimizer.batch.length).toBe(0);
    expect(mockBatch.set).toHaveBeenCalledWith("r1", { v: 1 }, undefined);
    expect(mockBatch.update).toHaveBeenCalledWith("r2", { v: 2 });
    expect(mockBatch.delete).toHaveBeenCalledWith("r3");
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
  });

  it("should re-queue failed operations when commit throws an error", async () => {
    mockBatch.commit.mockRejectedValue(
      new Error("Firebase Transaction Conflict"),
    );
    const optimizer = new FirestoreBatchOptimizer(1000, 2);
    optimizer.add({ type: "set", docRef: "r1", data: { v: 1 } });

    // Force flush
    await expect(optimizer.flush()).rejects.toThrow(
      "Firebase Transaction Conflict",
    );

    // Operations should be put back in the queue
    expect(optimizer.batch.length).toBe(1);
    expect(optimizer.batch[0].docRef).toBe("r1");
  });
});
