import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type SessionRole = "admin" | "member";

export async function requireAuth() {
  const { userId } = await auth.protect();
  return userId;
}

export async function getSessionEmail(): Promise<string> {
  try {
    const user = await currentUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    if (!email) {
      redirect("/sign-in");
    }
    return email.toLowerCase().trim();
  } catch {
    // Stale session cookie against a different Clerk instance / deleted user
    redirect("/sign-in");
  }
}

export async function getSessionRole(): Promise<SessionRole> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return "member";
  }

  // Prefer JWT claims when available (avoids an extra Backend API call)
  const claimRole =
    (sessionClaims?.metadata as { role?: string } | undefined)?.role ??
    (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
  if (claimRole === "admin") {
    return "admin";
  }

  try {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    return role === "admin" ? "admin" : "member";
  } catch {
    return "member";
  }
}

export async function requireAdmin() {
  await requireAuth();
  const role = await getSessionRole();
  if (role !== "admin") {
    redirect("/dashboard");
  }
}

export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) {
    return false;
  }
  const role = await getSessionRole();
  return role === "admin";
}
