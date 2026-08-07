"use server";

import { signIn } from "@/auth";

function safeNext(nextPath?: string): string {
  return nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
}

export async function signInWithGoogle(nextPath?: string) {
  await signIn("google", { redirectTo: safeNext(nextPath) });
}

export async function signInWithApple(nextPath?: string) {
  await signIn("apple", { redirectTo: safeNext(nextPath) });
}
