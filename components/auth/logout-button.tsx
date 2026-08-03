import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <form action={logout}>
      <button
        type="submit"
        className={
          className ??
          "flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
        }
      >
        <LogOut className="h-4 w-4" />
        Log out
      </button>
    </form>
  );
}
