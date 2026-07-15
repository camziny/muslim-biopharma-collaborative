import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeMember } from "@/lib/test-fixtures";

vi.mock("@/lib/auth", () => ({
  getSessionEmail: vi.fn(),
}));

vi.mock("@/lib/sheets", () => ({
  getMemberByEmail: vi.fn(),
  isSheetsConfigured: vi.fn(),
}));

import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isSheetsConfigured } from "@/lib/sheets";
import { getPostAuthPath } from "@/lib/post-auth";

describe("getPostAuthPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends users to onboarding when Sheets is not configured", async () => {
    vi.mocked(isSheetsConfigured).mockReturnValue(false);

    await expect(getPostAuthPath()).resolves.toBe("/onboarding");
    expect(getSessionEmail).not.toHaveBeenCalled();
  });

  it("sends existing members to the dashboard", async () => {
    vi.mocked(isSheetsConfigured).mockReturnValue(true);
    vi.mocked(getSessionEmail).mockResolvedValue("aisha@acme.com");
    vi.mocked(getMemberByEmail).mockResolvedValue(makeMember());

    await expect(getPostAuthPath()).resolves.toBe("/dashboard");
  });

  it("sends new accounts to onboarding", async () => {
    vi.mocked(isSheetsConfigured).mockReturnValue(true);
    vi.mocked(getSessionEmail).mockResolvedValue("new@acme.com");
    vi.mocked(getMemberByEmail).mockResolvedValue(null);

    await expect(getPostAuthPath()).resolves.toBe("/onboarding");
  });

  it("falls back to onboarding when lookup fails", async () => {
    vi.mocked(isSheetsConfigured).mockReturnValue(true);
    vi.mocked(getSessionEmail).mockRejectedValue(new Error("stale session"));

    await expect(getPostAuthPath()).resolves.toBe("/onboarding");
  });
});
