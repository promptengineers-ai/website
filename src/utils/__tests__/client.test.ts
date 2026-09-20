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

describe("apiClient.register", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const input = {
    name: "Ada",
    email: "ada@example.com",
    password: "Passw0rdOK",
  };

  it("posts name, email and password to /api/auth/register", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        jsonResponse({ message: "ok", requiresVerification: true }, 201),
      );

    await expect(apiClient.register(input)).resolves.toEqual({
      message: "ok",
      requiresVerification: true,
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(input),
      }),
    );
  });

  it("throws on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Failed to create user" }, 500),
    );

    await expect(apiClient.register(input)).rejects.toThrow(
      /failed to create user/i,
    );
  });

  it("surfaces the duplicate-email message and status on 409", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Email is already registered" }, 409),
    );

    await expect(apiClient.register(input)).rejects.toMatchObject({
      message: "Email is already registered",
      status: 409,
    });
  });

  it("surfaces password rule details on 400", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(
        {
          error: "Password does not meet requirements",
          details: [
            "Password must be at least 8 characters long",
            "Password must contain at least one number",
          ],
        },
        400,
      ),
    );

    await expect(apiClient.register(input)).rejects.toMatchObject({
      message: "Password does not meet requirements",
      status: 400,
      details: [
        "Password must be at least 8 characters long",
        "Password must contain at least one number",
      ],
    });
  });

  it("falls back to a status message when the body is not JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("<html>bad gateway</html>", { status: 502 }),
    );

    await expect(apiClient.register(input)).rejects.toThrow(/502/);
  });
});

describe("apiClient.resendVerification", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts the email to /api/auth/resend-verification", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ message: "sent" }, 200));

    await expect(
      apiClient.resendVerification("ada@example.com"),
    ).resolves.toEqual({ message: "sent" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/auth/resend-verification",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "ada@example.com" }),
      }),
    );
  });

  it("throws on non-ok response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ error: "Failed to send verification email." }, 500),
    );

    await expect(
      apiClient.resendVerification("ada@example.com"),
    ).rejects.toThrow(/failed to send verification email/i);
  });
});
