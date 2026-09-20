import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MemberStrip from "../MemberStrip";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as React.ImgHTMLAttributes<HTMLImageElement>)} />;
  },
}));

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const member = (id: string, name: string, chapters: string[]) => ({
  _id: id,
  userId: `user-${id}`,
  name,
  seeking: "networking",
  chapters,
  background: `${name} builds agents`,
});

describe("MemberStrip", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when no public members exist", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ members: [], pagination: null }));

    const { container } = render(<MemberStrip />);

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled());
    await waitFor(() => expect(container).toBeEmptyDOMElement());
    expect(
      screen.queryByRole("link", { name: /see all/i }),
    ).not.toBeInTheDocument();
  });

  it("renders nothing when the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("offline"));

    const { container } = render(<MemberStrip />);

    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("requests a cross-chapter random sample and links to the directory", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({
        members: [
          member("1", "Ada", ["plano"]),
          member("2", "Grace", ["st-george"]),
        ],
        pagination: null,
      }),
    );

    render(<MemberStrip />);

    await waitFor(() =>
      expect(screen.getByRole("link", { name: /see all/i })).toHaveAttribute(
        "href",
        "/members",
      ),
    );

    const url = new URL(String(fetchSpy.mock.calls[0][0]), "http://localhost");
    expect(url.pathname).toBe("/api/members");
    expect(url.searchParams.get("random")).toBe("true");
    expect(url.searchParams.has("chapter")).toBe(false);
    expect(Number(url.searchParams.get("limit"))).toBeGreaterThanOrEqual(6);
    expect(Number(url.searchParams.get("limit"))).toBeLessThanOrEqual(8);

    expect(screen.getByRole("link", { name: /ada/i })).toHaveAttribute(
      "href",
      "/members/user-1",
    );
    expect(screen.getByText("Grace")).toBeInTheDocument();
  });
});
