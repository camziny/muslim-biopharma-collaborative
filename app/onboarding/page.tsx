import { redirect } from "next/navigation";
import { MemberForm } from "@/components/member-form";
import { PageHeader } from "@/components/page-header";
import { SheetsSetupNotice } from "@/components/sheets-setup-notice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSessionEmail, requireAuth } from "@/lib/auth";
import { getMemberByEmail, isSheetsConfigured } from "@/lib/sheets";
import { toSheetsUiError } from "@/lib/sheets-ui";

export default async function OnboardingPage() {
  await requireAuth();
  const email = await getSessionEmail();
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();

  if (!isSheetsConfigured()) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <PageHeader title="Almost there" className="mb-6" />
        <p className="mb-6 text-sm text-muted-foreground">
          You&apos;re signed in as{" "}
          <span className="font-medium text-foreground">{email}</span>. Finish
          Sheets setup to continue.
        </p>
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

  if (member) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <PageHeader
        eyebrow="Registration"
        title="Complete your profile"
        description={
          <>
            Signed in as{" "}
            <span className="font-medium text-foreground">{email}</span>. You can
            update this anytime from your dashboard.
          </>
        }
      />

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Directory details</CardTitle>
          <CardDescription>
            Shared with the board in the member directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberForm mode="register" workEmail={email} />
        </CardContent>
      </Card>
    </main>
  );
}
