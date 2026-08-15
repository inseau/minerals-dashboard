import type { Metadata } from "next";
import "./globals.css";

import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DashboardProvider } from "@/lib/dashboard-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { FilterBar } from "@/components/dashboard/filter-bar";

export const metadata: Metadata = {
  title: "inseau | Critical Minerals & Rare Earths Intelligence",
  description:
    "Interactive market intelligence dashboard for critical mineral and rare earth supply, price, and risk data (2015-2026), by inseau.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full min-h-screen flex-col bg-background font-sans text-foreground">
        <ThemeProvider>
          <DashboardProvider>
            <TooltipProvider>
              <div className="flex min-h-screen w-full">
                <Sidebar />
                <div className="flex min-w-0 flex-1 flex-col">
                  <MobileNav />
                  <FilterBar />
                  <main className="flex-1 overflow-x-hidden px-4 py-5 md:px-6 md:py-6">
                    {children}
                  </main>
                </div>
              </div>
            </TooltipProvider>
          </DashboardProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
