import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "../Toast";

function ToastTrigger() {
  const { toast } = useToast();
  return (
    <button onClick={() => toast("Test message", "success")}>Show toast</button>
  );
}

describe("Toast", () => {
  it("renders toast when triggered", async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    await act(async () => {
      screen.getByText("Show toast").click();
    });

    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("auto-dismisses after 3 seconds", async () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    await act(async () => {
      screen.getByText("Show toast").click();
    });

    expect(screen.getByText("Test message")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(3100);
    });

    expect(screen.queryByText("Test message")).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
