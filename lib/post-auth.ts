import { getSessionEmail } from "@/lib/auth";
import { getMemberByEmail, isSheetsConfigured } from "@/lib/sheets";

/**
 * Where a signed-in user should land after auth.
 * New accounts (no directory row yet) go to onboarding.
 */
export async function getPostAuthPath(): Promise<"/onboarding" | "/dashboard"> {
  if (!isSheetsConfigured()) {
    return "/onboarding";
  }

  try {
    const email = await getSessionEmail();
    const member = await getMemberByEmail(email);
    return member ? "/dashboard" : "/onboarding";
  } catch {
    return "/onboarding";
  }
}
