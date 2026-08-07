import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionCaregiverId } from "@/lib/auth/session";
import { SignUpForm } from "@/components/auth/signup-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SnugMark } from "@/components/ui/snug-mark";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  const caregiverId = await getSessionCaregiverId();
  if (caregiverId) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <SnugMark className="h-10 w-10 text-teal-600" />
        <h1 className="font-fredoka text-2xl font-semibold text-teal-700 dark:text-teal-400">
          Create your Snug account
        </h1>
        <p className="text-sm text-zinc-500">
          Starts your own private family. Add babies and invite caregivers once you&rsquo;re in.
        </p>
      </div>
      <OAuthButtons nextPath={next}>
        <SignUpForm nextPath={next} />
      </OAuthButtons>
      <p className="text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
