"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
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
  type AdminMemberFormValues,
  type MemberFormValues,
} from "@/lib/member-schema";
import {
  createMember,
  deleteMemberByEmail,
  deleteMemberByRow,
  getMemberByRow,
  updateMemberByEmail,
  updateMemberByRow,
} from "@/lib/sheets";

export type ActionResult = {
  success: boolean;
  message?: string;
};

export async function registerMember(
  values: MemberFormValues,
): Promise<ActionResult> {
  try {
    const userId = await requireAuth();
    const email = await getSessionEmail();
    await createMember(email, values, userId);
    revalidatePath("/dashboard");
    revalidatePath("/onboarding");
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to complete registration.",
    };
  }

  redirect("/dashboard");
}

export async function updateMyProfile(
  values: MemberFormValues,
): Promise<ActionResult> {
  try {
    const userId = await requireAuth();
    const email = await getSessionEmail();
    await updateMemberByEmail(email, values, userId);
    revalidatePath("/dashboard");
    return { success: true, message: "Profile updated." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to update profile.",
    };
  }
}

/** Self-serve account deletion: Sheet row first, then Clerk user. */
export async function deleteMyAccount(): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, message: "You must be signed in." };
    }

    const email = await getSessionEmail();
    await deleteMemberByEmail(email);

    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return { success: true, message: "Your account has been deleted." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to delete account.",
    };
  }
}

export async function adminUpdateMember(
  rowIndex: number,
  values: AdminMemberFormValues,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateMemberByRow(rowIndex, values);
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true, message: "Member updated." };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to update member.",
    };
  }
}

export async function adminDeleteMember(
  rowIndex: number,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const sessionEmail = await getSessionEmail();
    const member = await getMemberByRow(rowIndex);

    if (!member) {
      return { success: false, message: "Member not found." };
    }

    if (member.emailWork.toLowerCase().trim() === sessionEmail) {
      return {
        success: false,
        message: "You can’t remove your own account.",
      };
    }

    await deleteMemberByRow(rowIndex);

    let clerkDeleted = false;
    if (member.emailWork) {
      const result = await deleteClerkUserByEmail(member.emailWork);
      clerkDeleted = result.deleted;
    }

    revalidatePath("/admin");
    return {
      success: true,
      message: clerkDeleted
        ? "Member removed from the directory and their login was deleted."
        : "Member removed from the directory.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to delete member.",
    };
  }
}

export async function adminSetMemberRole(
  email: string,
  makeAdmin: boolean,
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const sessionEmail = await getSessionEmail();
    const target = email.toLowerCase().trim();

    if (!makeAdmin && target === sessionEmail) {
      return {
        success: false,
        message: "You can’t remove your own admin access.",
      };
    }

    await setClerkUserAdminRole(target, makeAdmin);
    revalidatePath("/admin");
    return {
      success: true,
      message: makeAdmin
        ? "Admin access granted. They may need to refresh to see it."
        : "Admin access removed.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unable to update admin role.",
    };
  }
}
