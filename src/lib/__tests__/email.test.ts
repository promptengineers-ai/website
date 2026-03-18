import { generateVerificationToken } from "../email";

describe("generateVerificationToken", () => {
  it("returns a 64-character hex token", () => {
    const { token } = generateVerificationToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns an expiry date in the future", () => {
    const { expiry } = generateVerificationToken();
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns an expiry approximately 24 hours from now", () => {
    const { expiry } = generateVerificationToken();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const diff = expiry.getTime() - Date.now();
    // Allow 5 seconds tolerance
    expect(diff).toBeGreaterThan(twentyFourHours - 5000);
    expect(diff).toBeLessThanOrEqual(twentyFourHours);
  });

  it("generates unique tokens on each call", () => {
    const { token: t1 } = generateVerificationToken();
    const { token: t2 } = generateVerificationToken();
    expect(t1).not.toBe(t2);
  });
});
