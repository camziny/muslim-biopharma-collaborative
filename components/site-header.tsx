import Link from "next/link";
import { Show } from "@clerk/nextjs";
import { AccountButton } from "@/components/account-button";
import { isAdmin } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  let admin = false;
  try {
    admin = await isAdmin();
  } catch {
    admin = false;
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          MBC
        </Link>

        <nav className="flex items-center gap-1">
          <Show when="signed-in">
            <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
              Dashboard
            </Button>
            {admin ? (
              <Button variant="ghost" size="sm" render={<Link href="/admin" />}>
                Admin
              </Button>
            ) : null}
            <div className="ml-2">
              <AccountButton />
            </div>
          </Show>
          <Show when="signed-out">
            <Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>
              Sign in
            </Button>
            <Button size="sm" render={<Link href="/sign-up" />}>
              Join
            </Button>
          </Show>
        </nav>
      </div>
    </header>
  );
}
