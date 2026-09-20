import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../client";

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("apiClient.contactFormSubmit", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Failed to subscribe" }, 500),
    );

    await expect(
      apiClient.contactFormSubmit({ Email: "a@b.co" }),
    ).rejects.toThrow(/failed to subscribe/i);
  });

  it("returns the parsed body on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ message: "Successfully Subscribed!" }, 201),
    );

    await expect(
      apiClient.contactFormSubmit({ Email: "a@b.co" }),
    ).resolves.toEqual({ message: "Successfully Subscribed!" });
  });
});
