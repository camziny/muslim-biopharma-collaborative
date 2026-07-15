import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPostAuthPath } from "@/lib/post-auth";

export default async function Home() {
  const { userId } = await auth();
  const signedIn = Boolean(userId);

  // Incomplete profiles (right after sign-up / Google OAuth) shouldn't sit on home
  if (userId) {
    const path = await getPostAuthPath();
    if (path === "/onboarding") {
      redirect("/onboarding");
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-sm text-muted-foreground">Member portal</p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Muslim Biopharma
          <br />
          Collaborative
        </h1>

        <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
          {signedIn
            ? "Update your directory profile and access the member WhatsApp group."
            : "Sign in with your work email to manage your profile and join the member WhatsApp group."}
        </p>

        <div className="mt-8 flex items-center gap-3">
          {signedIn ? (
            <Button render={<Link href="/dashboard" />}>
              Dashboard
              <ArrowRight />
            </Button>
          ) : (
            <>
              <Button render={<Link href="/sign-up" />}>
                Get started
                <ArrowRight />
              </Button>
              <Button variant="outline" render={<Link href="/sign-in" />}>
                Sign in
              </Button>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
