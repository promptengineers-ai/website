import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfileForm from "../ProfileForm";

vi.mock("../RichTextEditor", () => ({
  default: () => <div data-testid="rich-text-editor" />,
}));

vi.mock("../AvatarUpload", () => ({
  default: () => <div data-testid="avatar-upload" />,
}));

const directoryCheckbox = () =>
  screen.getByRole("checkbox", { name: /list me in the member directory/i });

const resumeCheckbox = () =>
  screen.getByRole("checkbox", {
    name: /share my resume with signed-in members/i,
  });

describe("ProfileForm visibility choices", () => {
  it("visibility choice defaults to not listed for a new profile", () => {
    render(<ProfileForm onSubmit={vi.fn()} />);

    expect(directoryCheckbox()).not.toBeChecked();
    expect(resumeCheckbox()).not.toBeChecked();
  });

  it("states the benefit and what becomes visible", () => {
    render(<ProfileForm onSubmit={vi.fn()} />);

    const directory = directoryCheckbox();
    expect(directory).toHaveAccessibleDescription(
      /findable by other members and potential collaborators/i,
    );
    expect(directory).toHaveAccessibleDescription(/anyone who visits/i);
    expect(directory).toHaveAccessibleDescription(
      /display name, avatar, chapters, career intentions, background, and social links/i,
    );
    expect(directory).toHaveAccessibleDescription(
      /email is shown only to signed-in members/i,
    );
    expect(directory).toHaveAccessibleDescription(/resume is not included/i);

    const resume = resumeCheckbox();
    expect(resume).toHaveAccessibleDescription(/signed in/i);
    expect(resume).toHaveAccessibleDescription(/only you can download it/i);
    expect(resume).toHaveAccessibleDescription(
      /separate from the directory listing/i,
    );
  });

  it("directory and resume opt-ins are independent controls", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProfileForm userName="Ada" onSubmit={onSubmit} />);

    expect(directoryCheckbox()).not.toBe(resumeCheckbox());

    await user.click(directoryCheckbox());
    expect(directoryCheckbox()).toBeChecked();
    expect(resumeCheckbox()).not.toBeChecked();

    await user.click(directoryCheckbox());
    await user.click(resumeCheckbox());
    expect(resumeCheckbox()).toBeChecked();
    expect(directoryCheckbox()).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: /save profile/i }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        isPublic: false,
        resumeVisibleToMembers: true,
      }),
    );
  });
});
