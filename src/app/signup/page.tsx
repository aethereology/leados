import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { signUpAction } from "@/app/(auth)/actions";

export default function SignupPage() {
  return (
    <main className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold">
            <span className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs">
              LO
            </span>
            LeadOS
          </Link>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Create your agency
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start capturing leads in minutes.
          </p>
        </div>

        <AuthForm action={signUpAction} submitLabel="Create account" />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
