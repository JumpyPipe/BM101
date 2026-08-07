import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionCaregiverId } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SnugMark } from "@/components/ui/snug-mark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const caregiverId = await getSessionCaregiverId();
  if (caregiverId) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <SnugMark className="h-10 w-10 text-teal-600" />
        <h1 className="font-fredoka text-2xl font-semibold text-teal-700 dark:text-teal-400">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500">Sign in to see your baby&rsquo;s log.</p>
      </div>
      {error && (
        <p className="w-full rounded-xl bg-red-50 px-3 py-2 text-center text-sm text-red-600 dark:bg-red-950/50">
          Couldn&rsquo;t sign you in that way. Try again, or use email and password.
        </p>
      )}
      <OAuthButtons nextPath={next}>
        <LoginForm nextPath={next} />
      </OAuthButtons>
      <p className="text-center text-sm text-zinc-500">
        New to Snug?{" "}
        <Link href="/signup" className="font-medium text-teal-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
