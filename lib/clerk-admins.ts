import { clerkClient } from "@clerk/nextjs/server";

export type ClerkAccountInfo = {
  userId: string;
  isAdmin: boolean;
};

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function isAdminMetadata(metadata: Record<string, unknown> | null | undefined) {
  return metadata?.role === "admin";
}

/**
 * Resolve Clerk accounts for a list of emails (batched).
 * Members who have never signed up won't appear in the map.
 */
export async function getClerkAccountsByEmails(
  emails: string[],
): Promise<Map<string, ClerkAccountInfo>> {
  const unique = [...new Set(emails.map(normalizeEmail).filter(Boolean))];
  const result = new Map<string, ClerkAccountInfo>();
  if (unique.length === 0) return result;

  const client = await clerkClient();
  const chunkSize = 50;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { data } = await client.users.getUserList({
      emailAddress: chunk,
      limit: chunkSize,
    });

    for (const user of data) {
      const email = user.emailAddresses
        .map((e) => normalizeEmail(e.emailAddress))
        .find((e) => chunk.includes(e));
      if (!email) continue;

      result.set(email, {
        userId: user.id,
        isAdmin: isAdminMetadata(user.publicMetadata as Record<string, unknown>),
      });
    }
  }

  return result;
}

async function findClerkUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const client = await clerkClient();
  const { data } = await client.users.getUserList({
    emailAddress: [normalized],
    limit: 1,
  });
  return data[0] ?? null;
}

export async function setClerkUserAdminRole(
  email: string,
  makeAdmin: boolean,
): Promise<{ userId: string }> {
  const user = await findClerkUserByEmail(email);
  if (!user) {
    throw new Error(
      "No Clerk account found for this email. They need to sign up first.",
    );
  }

  const existing = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const client = await clerkClient();
  await client.users.updateUserMetadata(user.id, {
    publicMetadata: {
      ...existing,
      role: makeAdmin ? "admin" : "member",
    },
  });

  return { userId: user.id };
}

/** Deletes the Clerk user if one exists for this email. No-op if none. */
export async function deleteClerkUserByEmail(
  email: string,
): Promise<{ deleted: boolean }> {
  const user = await findClerkUserByEmail(email);
  if (!user) {
    return { deleted: false };
  }

  const client = await clerkClient();
  await client.users.deleteUser(user.id);
  return { deleted: true };
}
