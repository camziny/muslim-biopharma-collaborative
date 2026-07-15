"use client";

import { useState, useTransition } from "react";
import { UserButton, useClerk } from "@clerk/nextjs";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteMyAccount } from "@/app/actions/members";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AccountButton() {
  const { signOut } = useClerk();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteMyAccount();
      if (!result.success) {
        toast.error(result.message ?? "Unable to delete account.");
        return;
      }

      setConfirmOpen(false);
      toast.success("Account deleted.");
      try {
        await signOut({ redirectUrl: "/" });
      } catch {
        window.location.href = "/";
      }
    });
  };

  return (
    <>
      <UserButton>
        <UserButton.MenuItems>
          <UserButton.Action label="manageAccount" />
          <UserButton.Action
            label="Delete account"
            labelIcon={<Trash2 className="size-4" />}
            onClick={() => setConfirmOpen(true)}
          />
          <UserButton.Action label="signOut" />
        </UserButton.MenuItems>
      </UserButton>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes your directory profile and login. You
              won&apos;t be able to sign back in with this account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? "Deleting..." : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
