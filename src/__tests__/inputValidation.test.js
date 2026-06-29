import { describe, it, expect } from "vitest";
import { containsXSSPatterns, sanitizeText } from "../utils/inputValidation";

describe("inputValidation XSS detection", () => {
  it("should detect script tags", () => {
    const malicious = "<script>alert('xss')</script>";
    expect(containsXSSPatterns(malicious)).toBe(true);
    // Test multiple times to verify regex statefulness fix
    expect(containsXSSPatterns(malicious)).toBe(true);
    expect(containsXSSPatterns(malicious)).toBe(true);
  });

  it("should detect iframe tags", () => {
    const malicious = "<iframe src='javascript:alert(1)'></iframe>";
    expect(containsXSSPatterns(malicious)).toBe(true);
    expect(containsXSSPatterns(malicious)).toBe(true);
  });

  it("should detect on handlers", () => {
    const malicious = "<img src='x' onerror='alert(1)'>";
    expect(containsXSSPatterns(malicious)).toBe(true);
    expect(containsXSSPatterns(malicious)).toBe(true);
  });

  it("should detect javascript: protocol", () => {
    const malicious = "javascript:alert(1)";
    expect(containsXSSPatterns(malicious)).toBe(true);
  });

  it("should return false for safe strings", () => {
    const safe = "Hello Developer, welcome to RankerHub!";
    expect(containsXSSPatterns(safe)).toBe(false);
  });

  it("should sanitize text correctly", () => {
    const malicious = "Hello <script>alert(1)</script> World";
    expect(sanitizeText(malicious)).toBe("Hello World");
  });

  it("should sanitize multiple malicious patterns correctly", () => {
    const malicious =
      "Hello <script>alert(1)</script> and <script>alert(2)</script> World";
    expect(sanitizeText(malicious)).toBe("Hello and World");
  });
});
