import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeFormValues, makeMember } from "@/lib/test-fixtures";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSessionEmail: vi.fn(),
  requireAdmin: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("@/lib/clerk-admins", () => ({
  deleteClerkUserByEmail: vi.fn(),
  setClerkUserAdminRole: vi.fn(),
}));

vi.mock("@/lib/sheets", () => ({
  createMember: vi.fn(),
  deleteMemberByEmail: vi.fn(),
  deleteMemberByRow: vi.fn(),
  getMemberByRow: vi.fn(),
  updateMemberByEmail: vi.fn(),
  updateMemberByRow: vi.fn(),
}));

import { auth, clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  adminDeleteMember,
  adminSetMemberRole,
  deleteMyAccount,
  registerMember,
  updateMyProfile,
} from "@/app/actions/members";
import {
  getSessionEmail,
  requireAdmin,
  requireAuth,
} from "@/lib/auth";
import {
  deleteClerkUserByEmail,
  setClerkUserAdminRole,
} from "@/lib/clerk-admins";
import {
  createMember,
  deleteMemberByEmail,
  deleteMemberByRow,
  getMemberByRow,
  updateMemberByEmail,
} from "@/lib/sheets";

describe("member actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue("user_123");
    vi.mocked(requireAdmin).mockResolvedValue(undefined as never);
    vi.mocked(getSessionEmail).mockResolvedValue("aisha@acme.com");
  });

  describe("registerMember", () => {
    it("creates a sheet row and redirects to dashboard", async () => {
      vi.mocked(createMember).mockResolvedValue(makeMember());

      await expect(registerMember(makeFormValues())).rejects.toThrow(
        "NEXT_REDIRECT",
      );

      expect(createMember).toHaveBeenCalledWith(
        "aisha@acme.com",
        makeFormValues(),
        "user_123",
      );
      expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
      expect(redirect).toHaveBeenCalledWith("/dashboard");
    });

    it("returns an error when creation fails", async () => {
      vi.mocked(createMember).mockRejectedValue(new Error("duplicate email"));

      await expect(registerMember(makeFormValues())).resolves.toEqual({
        success: false,
        message: "duplicate email",
      });
      expect(redirect).not.toHaveBeenCalled();
    });
  });

  describe("updateMyProfile", () => {
    it("updates the member row for the signed-in email", async () => {
      vi.mocked(updateMemberByEmail).mockResolvedValue(makeMember());

      await expect(updateMyProfile(makeFormValues())).resolves.toEqual({
        success: true,
        message: "Profile updated.",
      });

      expect(updateMemberByEmail).toHaveBeenCalledWith(
        "aisha@acme.com",
        makeFormValues(),
        "user_123",
      );
    });
  });

  describe("deleteMyAccount", () => {
    it("requires a signed-in user", async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as never);

      await expect(deleteMyAccount()).resolves.toEqual({
        success: false,
        message: "You must be signed in.",
      });
    });

    it("deletes the sheet row then the Clerk user", async () => {
      const deleteUser = vi.fn().mockResolvedValue(undefined);
      vi.mocked(auth).mockResolvedValue({ userId: "user_123" } as never);
      vi.mocked(deleteMemberByEmail).mockResolvedValue(true);
      vi.mocked(clerkClient).mockResolvedValue({
        users: { deleteUser },
      } as never);

      await expect(deleteMyAccount()).resolves.toEqual({
        success: true,
        message: "Your account has been deleted.",
      });

      expect(deleteMemberByEmail).toHaveBeenCalledWith("aisha@acme.com");
      expect(deleteUser).toHaveBeenCalledWith("user_123");
    });
  });

  describe("adminDeleteMember", () => {
    it("blocks admins from deleting themselves", async () => {
      vi.mocked(getMemberByRow).mockResolvedValue(
        makeMember({ emailWork: "aisha@acme.com" }),
      );

      await expect(adminDeleteMember(3)).resolves.toEqual({
        success: false,
        message: "You can’t remove your own account.",
      });
      expect(deleteMemberByRow).not.toHaveBeenCalled();
    });

    it("removes the sheet row and clerk account for another member", async () => {
      vi.mocked(getMemberByRow).mockResolvedValue(
        makeMember({ emailWork: "other@acme.com" }),
      );
      vi.mocked(deleteMemberByRow).mockResolvedValue(undefined);
      vi.mocked(deleteClerkUserByEmail).mockResolvedValue({ deleted: true });

      await expect(adminDeleteMember(3)).resolves.toEqual({
        success: true,
        message:
          "Member removed from the directory and their login was deleted.",
      });

      expect(deleteMemberByRow).toHaveBeenCalledWith(3);
      expect(deleteClerkUserByEmail).toHaveBeenCalledWith("other@acme.com");
    });
  });

  describe("adminSetMemberRole", () => {
    it("blocks removing your own admin access", async () => {
      await expect(
        adminSetMemberRole("aisha@acme.com", false),
      ).resolves.toEqual({
        success: false,
        message: "You can’t remove your own admin access.",
      });
      expect(setClerkUserAdminRole).not.toHaveBeenCalled();
    });

    it("grants admin access to another member", async () => {
      vi.mocked(setClerkUserAdminRole).mockResolvedValue({
        userId: "user_other",
      });

      await expect(
        adminSetMemberRole("Other@acme.com", true),
      ).resolves.toEqual({
        success: true,
        message: "Admin access granted. They may need to refresh to see it.",
      });

      expect(setClerkUserAdminRole).toHaveBeenCalledWith(
        "other@acme.com",
        true,
      );
    });
  });
});
