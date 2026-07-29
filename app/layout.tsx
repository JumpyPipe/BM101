import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import "./globals.css";
import { getCurrentBaby } from "@/lib/current-baby";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { BabySwitcher } from "@/components/dashboard/baby-switcher";
import { Button } from "@/components/ui/button";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BM101 — Baby Management",
  description: "Track feedings, sleep, diapers, growth, and milestones — with AI-powered insights.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { babies, current } = await getCurrentBaby();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Heart className="h-5 w-5 text-rose-600" />
              BM101
            </Link>
            {current && <BabySwitcher babies={babies} currentId={current.id} />}
          </header>

          <aside className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
            <div className="hidden items-center gap-2 px-4 pt-5 font-semibold lg:flex">
              <Heart className="h-5 w-5 text-rose-600" />
              BM101
            </div>
            <div className="hidden px-3 pt-4 lg:block">
              {current ? (
                <BabySwitcher babies={babies} currentId={current.id} />
              ) : (
                <Link href="/babies/new">
                  <Button size="sm" className="w-full">
                    <Plus className="h-4 w-4" /> Add a baby
                  </Button>
                </Link>
              )}
            </div>
            <SidebarNav />
          </aside>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
