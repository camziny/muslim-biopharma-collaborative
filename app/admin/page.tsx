import { AdminDirectory } from "@/components/admin-directory";
import { PageHeader } from "@/components/page-header";
import { SheetsSetupNotice } from "@/components/sheets-setup-notice";
import { getSessionEmail, requireAdmin } from "@/lib/auth";
import { getClerkAccountsByEmails } from "@/lib/clerk-admins";
import { isSheetsConfigured, listMembers } from "@/lib/sheets";

export default async function AdminPage() {
  await requireAdmin();
  const currentUserEmail = await getSessionEmail();

  if (!isSheetsConfigured()) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
        <PageHeader title="Setup incomplete" className="mb-6" />
        <SheetsSetupNotice />
      </main>
    );
  }

  const members = await listMembers();
  const clerkAccounts = await getClerkAccountsByEmails(
    members.map((m) => m.emailWork),
  );

  const rows = members.map((member) => {
    const account = clerkAccounts.get(member.emailWork.toLowerCase().trim());
    return {
      ...member,
      hasClerkAccount: Boolean(account),
      isAdmin: account?.isAdmin ?? false,
    };
  });

  const adminCount = rows.filter((r) => r.isAdmin).length;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="Member directory"
          description="Edit or remove members, and grant admin access. Directory data writes to the Google Sheet; admin roles live in Clerk."
        />
        <div className="flex shrink-0 gap-4 text-sm tabular-nums text-muted-foreground">
          <p>
            {rows.length} {rows.length === 1 ? "member" : "members"}
          </p>
          <p>
            {adminCount} {adminCount === 1 ? "admin" : "admins"}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <AdminDirectory members={rows} currentUserEmail={currentUserEmail} />
      </div>
    </main>
  );
}
