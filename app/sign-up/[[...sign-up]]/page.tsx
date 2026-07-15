import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Join MBC</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your account, then complete your directory profile.
        </p>
      </div>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/after-auth"
        fallbackRedirectUrl="/after-auth"
      />
    </main>
  );
}
