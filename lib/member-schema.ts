import { z } from "zod";

export const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  company: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Title is required"),
  function: z.string().min(1, "Function is required"),
  diseaseAreas: z.string().min(1, "Disease areas / platform focus is required"),
  emailPersonal: z
    .string()
    .email("Enter a valid personal email")
    .or(z.literal(""))
    .optional(),
  phone: z.string().optional(),
});

export const adminMemberSchema = memberSchema.extend({
  emailWork: z.string().email("Enter a valid work email"),
});

export type MemberFormValues = z.infer<typeof memberSchema>;
export type AdminMemberFormValues = z.infer<typeof adminMemberSchema>;

export const SHEET_COLUMNS = [
  "Name",
  "Company",
  "Title",
  "Function",
  "Disease Areas / Platform of Focus",
  "Email (work)",
  "Email (personal)",
  "Phone (optional)",
  "registered_at",
  "whatsapp_sent",
  "clerk_user_id",
] as const;

export type SheetColumn = (typeof SHEET_COLUMNS)[number];

export type Member = {
  rowIndex: number;
  name: string;
  company: string;
  title: string;
  function: string;
  diseaseAreas: string;
  emailWork: string;
  emailPersonal: string;
  phone: string;
  registeredAt: string;
  whatsappSent: boolean;
  clerkUserId: string;
};

export function memberToFormValues(member: Member): MemberFormValues {
  return {
    name: member.name,
    company: member.company,
    title: member.title,
    function: member.function,
    diseaseAreas: member.diseaseAreas,
    emailPersonal: member.emailPersonal || undefined,
    phone: member.phone || undefined,
  };
}

export function memberToAdminFormValues(member: Member): AdminMemberFormValues {
  return {
    ...memberToFormValues(member),
    emailWork: member.emailWork,
  };
}
