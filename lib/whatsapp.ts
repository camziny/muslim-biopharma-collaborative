import type { Member } from "@/lib/member-schema";

export function getWhatsAppInviteLink(): string | null {
  const link = process.env.WHATSAPP_INVITE_LINK?.trim();
  return link || null;
}

export function isRegisteredMember(registeredAt: string): boolean {
  return Boolean(registeredAt?.trim());
}

/** Required directory fields must be filled and registration timestamp set. */
export function isProfileComplete(
  member: Pick<
    Member,
    | "name"
    | "company"
    | "title"
    | "function"
    | "diseaseAreas"
    | "registeredAt"
  >,
): boolean {
  return (
    isRegisteredMember(member.registeredAt) &&
    Boolean(member.name?.trim()) &&
    Boolean(member.company?.trim()) &&
    Boolean(member.title?.trim()) &&
    Boolean(member.function?.trim()) &&
    Boolean(member.diseaseAreas?.trim())
  );
}
