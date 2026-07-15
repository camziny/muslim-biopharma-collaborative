import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getWhatsAppInviteLink } from "@/lib/whatsapp";

type WhatsAppInviteProps = {
  profileComplete: boolean;
};

export function WhatsAppInvite({ profileComplete }: WhatsAppInviteProps) {
  const inviteLink = getWhatsAppInviteLink();

  if (!profileComplete) {
    return (
      <div className="rounded-lg border border-dashed p-4">
        <p className="text-sm font-medium text-muted-foreground">
          WhatsApp group
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete and save your profile above to unlock the member invite.
        </p>
        <div className="mt-3">
          <Button size="sm" disabled>
            Open invite
            <ExternalLink />
          </Button>
        </div>
      </div>
    );
  }

  if (!inviteLink) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium">WhatsApp group</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Your profile is complete. The invite link will be available soon.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-medium">WhatsApp group</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Your profile is complete. Join the member group below.
      </p>
      <div className="mt-3">
        <Button
          size="sm"
          render={
            <Link href={inviteLink} target="_blank" rel="noopener noreferrer" />
          }
        >
          Open invite
          <ExternalLink />
        </Button>
      </div>
    </div>
  );
}
