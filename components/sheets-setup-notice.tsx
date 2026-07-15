import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SheetsSetupNoticeProps = {
  title?: string;
  description?: string;
  serviceAccountEmail?: string;
};

export function SheetsSetupNotice({
  title = "Google Sheets setup required",
  description = "Sign-in worked. The directory needs Google Sheets access before profiles can be saved.",
  serviceAccountEmail,
}: SheetsSetupNoticeProps) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Open your member spreadsheet in Google Sheets and click{" "}
            <strong>Share</strong>.
          </li>
          <li>
            Add this service account as <strong>Editor</strong>
            {serviceAccountEmail ? (
              <>
                :{" "}
                <code className="break-all rounded bg-muted px-1 py-0.5 text-xs">
                  {serviceAccountEmail}
                </code>
              </>
            ) : (
              " (the email in GOOGLE_SERVICE_ACCOUNT_EMAIL)."
            )}
          </li>
          <li>
            Uncheck &quot;Notify people&quot; if shown, then click{" "}
            <strong>Share</strong>.
          </li>
          <li>
            Refresh this page (restart{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">pnpm dev</code>{" "}
            if env vars just changed).
          </li>
        </ol>
      </CardContent>
    </Card>
  );
}
