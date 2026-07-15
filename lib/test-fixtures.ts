import type { Member, MemberFormValues } from "@/lib/member-schema";

export function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    rowIndex: 3,
    name: "Aisha Khan",
    company: "Acme Bio",
    title: "Scientist",
    function: "R&D",
    diseaseAreas: "Oncology",
    emailWork: "aisha@acme.com",
    emailPersonal: "",
    phone: "",
    registeredAt: "2026-07-15T12:00:00.000Z",
    whatsappSent: false,
    clerkUserId: "user_123",
    ...overrides,
  };
}

export function makeFormValues(
  overrides: Partial<MemberFormValues> = {},
): MemberFormValues {
  return {
    name: "Aisha Khan",
    company: "Acme Bio",
    title: "Scientist",
    function: "R&D",
    diseaseAreas: "Oncology",
    emailPersonal: "",
    phone: "",
    ...overrides,
  };
}
