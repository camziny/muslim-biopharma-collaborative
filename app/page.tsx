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
    <main className="relative flex flex-1 flex-col">
      <div
        className="bg-dots pointer-events-none absolute inset-0 -z-10"
        aria-hidden
      />
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <p className="eyebrow">Member portal</p>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl sm:leading-[1.05]">
          Muslim Biopharma Collaborative
        </h1>

        <p className="mt-5 max-w-md text-base leading-relaxed text-pretty text-muted-foreground">
          {signedIn
            ? "Manage your directory profile and access the member group."
            : "Sign in with your work email to manage your profile and join the member group."}
        </p>

        <div className="mt-8 flex items-center gap-3">
          {signedIn ? (
            <Button render={<Link href="/dashboard" />}>
              Go to dashboard
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

        <p className="mt-12 font-mono text-xs text-muted-foreground/80">
          Members only
        </p>
      </section>
    </main>
  );
}
