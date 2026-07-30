import type { Metadata, Viewport } from "next";
import { Nunito, Fredoka } from "next/font/google";
import Link from "next/link";
import { Plus } from "lucide-react";
import "./globals.css";
import { getCurrentBaby } from "@/lib/current-baby";
import { SidebarNav } from "@/components/dashboard/sidebar-nav";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { BabySwitcher } from "@/components/dashboard/baby-switcher";
import { Button } from "@/components/ui/button";
import { SnugMark } from "@/components/ui/snug-mark";

// The layout calls the database on every render (current baby, nav state).
// Without this, Next tries to statically prerender pages that don't have
// their own dynamic signal, executing that DB call at *build* time —
// coupling build success to database reachability. Force every route
// under this layout to render per-request instead.
export const dynamic = "force-dynamic";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

// Reserved for the "Snug" wordmark only — its rounder, bolder curves give
// the brand mark personality without hurting body-text readability.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Snug — Baby Management",
  description: "Track feedings, sleep, diapers, growth, and milestones — with AI-powered insights.",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Snug",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d9488",
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
      className={`${nunito.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <header
            className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900 lg:hidden"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <Link href="/" className="font-fredoka flex items-center gap-2 text-lg font-semibold text-teal-700 dark:text-teal-400">
              <SnugMark className="h-6 w-6 text-teal-600" />
              Snug
            </Link>
            {current && <BabySwitcher babies={babies} currentId={current.id} />}
          </header>

          <aside className="hidden border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:block lg:w-64 lg:shrink-0 lg:border-r">
            <div className="font-fredoka flex items-center gap-2 px-4 pt-5 text-lg font-semibold text-teal-700 dark:text-teal-400">
              <SnugMark className="h-6 w-6 text-teal-600" />
              Snug
            </div>
            <div className="px-3 pt-4">
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

          <main className="flex-1 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>

          <BottomNav />
        </div>
      </body>
    </html>
  );
}
