import { redirect } from "next/navigation";
import { getSessionCaregiverId } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";
import { SnugMark } from "@/components/ui/snug-mark";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const caregiverId = await getSessionCaregiverId();
  if (caregiverId) redirect("/");

  const { next } = await searchParams;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <SnugMark className="h-10 w-10 text-teal-600" />
        <h1 className="font-fredoka text-2xl font-semibold text-teal-700 dark:text-teal-400">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500">Sign in to see your baby&rsquo;s log.</p>
      </div>
      <LoginForm nextPath={next} />
    </div>
  );
}
