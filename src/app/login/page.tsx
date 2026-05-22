import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import { signInAction } from "@/app/(auth)/actions";

export default function LoginPage() {
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
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to your agency workspace.
          </p>
        </div>

        <AuthForm action={signInAction} submitLabel="Sign in" />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="text-primary font-medium underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
