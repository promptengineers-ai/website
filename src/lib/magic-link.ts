import crypto from "crypto";

export function generateMagicLinkToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashMagicLinkToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
