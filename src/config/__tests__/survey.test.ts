import { describe, it, expect } from "vitest";
import { SURVEY_URL } from "@/config/survey";

describe("survey config", () => {
  it("defines the community survey URL", () => {
    expect(SURVEY_URL).toBeDefined();
    expect(SURVEY_URL).toBe("https://forms.gle/DYBEgiiFGUUisw7V6");
  });
});
