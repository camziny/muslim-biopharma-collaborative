import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 w-full text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Join MBC</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your account, then complete your directory profile.
        </p>
      </div>
      <div className="w-full min-w-0">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/after-auth"
          fallbackRedirectUrl="/after-auth"
        />
      </div>
    </main>
  );
}
