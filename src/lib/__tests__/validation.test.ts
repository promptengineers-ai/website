import { describe, it, expect } from "vitest";
import { isValidObjectId, validateSlug, validateDate } from "../validation";

describe("isValidObjectId", () => {
  it("accepts valid 24-char hex strings", () => {
    expect(isValidObjectId("507f1f77bcf86cd799439011")).toBe(true);
    expect(isValidObjectId("aabbccddeeff00112233aabb")).toBe(true);
  });

  it("rejects non-hex strings", () => {
    expect(isValidObjectId("not-a-valid-object-id!!")).toBe(false);
    expect(isValidObjectId("zzzzzzzzzzzzzzzzzzzzzzzz")).toBe(false);
  });

  it("rejects wrong-length strings", () => {
    expect(isValidObjectId("507f1f77bcf86cd79943901")).toBe(false);
    expect(isValidObjectId("507f1f77bcf86cd7994390111")).toBe(false);
    expect(isValidObjectId("")).toBe(false);
  });

  it("rejects non-string inputs", () => {
    expect(isValidObjectId(null)).toBe(false);
    expect(isValidObjectId(undefined)).toBe(false);
    expect(isValidObjectId(123)).toBe(false);
    expect(isValidObjectId({})).toBe(false);
  });
});

describe("validateSlug", () => {
  it("accepts valid slugs", () => {
    expect(validateSlug("spring-2026")).toBe(true);
    expect(validateSlug("hackathon")).toBe(true);
    expect(validateSlug("my-cool-event-1")).toBe(true);
  });

  it("rejects uppercase letters", () => {
    expect(validateSlug("Spring-2026")).toBe(false);
  });

  it("rejects special characters", () => {
    expect(validateSlug("hack@thon")).toBe(false);
    expect(validateSlug("hack thon")).toBe(false);
    expect(validateSlug("hack/thon")).toBe(false);
  });

  it("rejects empty strings and non-strings", () => {
    expect(validateSlug("")).toBe(false);
    expect(validateSlug(null)).toBe(false);
    expect(validateSlug(undefined)).toBe(false);
    expect(validateSlug(123)).toBe(false);
  });
});

describe("validateDate", () => {
  it("parses valid ISO date strings", () => {
    const d = validateDate("2026-04-19T09:00:00Z");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2026);
  });

  it("returns null for invalid date strings", () => {
    expect(validateDate("not-a-date")).toBeNull();
    expect(validateDate("2026-13-45")).toBeNull();
  });

  it("returns null for non-string and falsy inputs", () => {
    expect(validateDate(null)).toBeNull();
    expect(validateDate(undefined)).toBeNull();
    expect(validateDate("")).toBeNull();
    expect(validateDate(123)).toBeNull();
  });
});
