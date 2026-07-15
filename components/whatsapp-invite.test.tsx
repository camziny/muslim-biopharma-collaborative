import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WhatsAppInvite } from "@/components/whatsapp-invite";

vi.mock("@/lib/whatsapp", async () => {
  const actual = await vi.importActual<typeof import("@/lib/whatsapp")>(
    "@/lib/whatsapp",
  );
  return {
    ...actual,
    getWhatsAppInviteLink: vi.fn(),
  };
});

import { getWhatsAppInviteLink } from "@/lib/whatsapp";

describe("WhatsAppInvite", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows a disabled invite until the profile is complete", () => {
    vi.mocked(getWhatsAppInviteLink).mockReturnValue(
      "https://chat.whatsapp.com/abc",
    );

    render(<WhatsAppInvite profileComplete={false} />);

    expect(
      screen.getByText(
        "Complete and save your profile above to unlock the member invite.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open invite/i })).toBeDisabled();
  });

  it("shows a waiting state when the profile is complete but no link is configured", () => {
    vi.mocked(getWhatsAppInviteLink).mockReturnValue(null);

    render(<WhatsAppInvite profileComplete />);

    expect(
      screen.getByText(
        "Your profile is complete. The invite link will be available soon.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /open invite/i }),
    ).not.toBeInTheDocument();
  });

  it("links to the invite when the profile is complete", () => {
    vi.mocked(getWhatsAppInviteLink).mockReturnValue(
      "https://chat.whatsapp.com/abc",
    );

    render(<WhatsAppInvite profileComplete />);

    const invite = screen.getByRole("button", { name: /open invite/i });
    expect(invite).toHaveAttribute("href", "https://chat.whatsapp.com/abc");
    expect(invite).toHaveAttribute("target", "_blank");
    expect(invite).not.toBeDisabled();
  });
});
