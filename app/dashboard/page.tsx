import { after } from "next/server";
import { redirect } from "next/navigation";
import { MemberForm } from "@/components/member-form";
import { PageHeader } from "@/components/page-header";
import { SheetsSetupNotice } from "@/components/sheets-setup-notice";
import { WhatsAppInvite } from "@/components/whatsapp-invite";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionEmail, requireAuth } from "@/lib/auth";
import { memberToFormValues } from "@/lib/member-schema";
import {
  getMemberByEmail,
  isSheetsConfigured,
  markWhatsAppSent,
  syncClerkUserId,
} from "@/lib/sheets";
import { toSheetsUiError } from "@/lib/sheets-ui";
import {
  getWhatsAppInviteLink,
  isProfileComplete,
} from "@/lib/whatsapp";

export default async function DashboardPage() {
  const userId = await requireAuth();
  const email = await getSessionEmail();
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();

  if (!isSheetsConfigured()) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <PageHeader title="Setup incomplete" className="mb-6" />
        <SheetsSetupNotice serviceAccountEmail={serviceAccountEmail} />
      </main>
    );
  }

  let member;
  try {
    member = await getMemberByEmail(email);
  } catch (error) {
    const ui = toSheetsUiError(error);
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <PageHeader title={ui.title} className="mb-6" />
        <SheetsSetupNotice
          title={ui.title}
          description={ui.description}
          serviceAccountEmail={serviceAccountEmail}
        />
      </main>
    );
  }

  if (!member) {
    redirect("/onboarding");
  }

  const profileComplete = isProfileComplete(member);
  const inviteLink = getWhatsAppInviteLink();

  after(async () => {
    await syncClerkUserId(email, userId);
    if (profileComplete && inviteLink && !member.whatsappSent) {
      await markWhatsAppSent(email);
    }
  });

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <PageHeader
        title={`Welcome back, ${member.name.split(" ")[0] || "there"}`}
        description="Complete your profile, then join the member WhatsApp group."
      />

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
            <CardDescription>
              Save your details to unlock the WhatsApp invite below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberForm
              mode="edit"
              workEmail={member.emailWork}
              defaultValues={memberToFormValues(member)}
            />
          </CardContent>
        </Card>

        <WhatsAppInvite profileComplete={profileComplete} />
      </div>
    </main>
  );
}
