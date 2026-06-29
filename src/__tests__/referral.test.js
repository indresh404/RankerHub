import { describe, it, expect } from "vitest";

// Core logic wrapper for testing
const generateReferralCode = (username, mockRandomVal) => {
  const prefix = username.substring(0, 3).toUpperCase().padEnd(3, "X");
  const randomStr = Math.floor(mockRandomVal * 10000)
    .toString()
    .padStart(4, "0");
  return `${prefix}-${randomStr}`;
};

const generateUniqueCode = (username, existingCodes, mockRandoms) => {
  let attempt = 0;
  let code;
  do {
    code = generateReferralCode(username, mockRandoms[attempt]);
    attempt++;
  } while (existingCodes.includes(code) && attempt < mockRandoms.length);

  if (existingCodes.includes(code))
    throw new Error("Collision limit reached. Retry required.");
  return code;
};

describe("Referral Logic & Collision Detection", () => {
  it("should generate a standard referral code format based on username", () => {
    const code = generateReferralCode("nitish", 0.1234);
    expect(code).toBe("NIT-1234");
  });

  it("should correctly pad the username to 3 characters if it is too short", () => {
    const code = generateReferralCode("bo", 0.5555);
    expect(code).toBe("BOX-5555");
  });

  it("should pad the random numeric string properly to 4 digits for low random values", () => {
    const code = generateReferralCode("john", 0.005);
    expect(code).toBe("JOH-0050");
  });

  it("should detect collisions and generate a new code successfully on the second attempt", () => {
    const existingCodes = ["ALE-5555"];
    const mockRandoms = [0.5555, 0.9999]; // First collides, second succeeds
    const newCode = generateUniqueCode("alex", existingCodes, mockRandoms);
    expect(newCode).toBe("ALE-9999");
  });

  it("should safely throw an error to trigger an external retry if all attempts collide", () => {
    const existingCodes = ["BOB-1111", "BOB-2222"];
    const mockRandoms = [0.1111, 0.2222]; // Both will collide, simulating exhaustion
    expect(() => generateUniqueCode("bob", existingCodes, mockRandoms)).toThrow(
      "Collision limit reached. Retry required.",
    );
  });
});
