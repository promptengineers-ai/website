import { generatePasswordResetToken } from "../email";

describe("generatePasswordResetToken", () => {
  it("returns a 64-character hex token", () => {
    const { token } = generatePasswordResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("returns an expiry date in the future", () => {
    const { expiry } = generatePasswordResetToken();
    expect(expiry.getTime()).toBeGreaterThan(Date.now());
  });

  it("returns an expiry approximately 1 hour from now", () => {
    const { expiry } = generatePasswordResetToken();
    const oneHour = 1 * 60 * 60 * 1000;
    const diff = expiry.getTime() - Date.now();
    // Allow 5 seconds tolerance
    expect(diff).toBeGreaterThan(oneHour - 5000);
    expect(diff).toBeLessThanOrEqual(oneHour);
  });

  it("generates unique tokens on each call", () => {
    const { token: t1 } = generatePasswordResetToken();
    const { token: t2 } = generatePasswordResetToken();
    expect(t1).not.toBe(t2);
  });
});
