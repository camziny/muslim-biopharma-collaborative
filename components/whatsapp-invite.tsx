import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getWhatsAppInviteLink } from "@/lib/whatsapp";

type WhatsAppInviteProps = {
  profileComplete: boolean;
};

export function WhatsAppInvite({ profileComplete }: WhatsAppInviteProps) {
  const inviteLink = getWhatsAppInviteLink();

  if (!profileComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp group</CardTitle>
          <CardDescription>
            Complete and save your profile above to unlock the invite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm" disabled>
            Open invite
            <ExternalLink />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!inviteLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp group</CardTitle>
          <CardDescription>
            Your profile is complete. The invite link will be available soon.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>WhatsApp group</CardTitle>
        <CardDescription>
          Your profile is complete. Join the member group below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          size="sm"
          render={
            <Link href={inviteLink} target="_blank" rel="noopener noreferrer" />
          }
        >
          Open invite
          <ExternalLink />
        </Button>
      </CardContent>
    </Card>
  );
}
