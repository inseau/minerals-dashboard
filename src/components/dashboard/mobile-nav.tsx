"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { InseauLogo } from "@/components/inseau-logo";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/trends", label: "Market Trends" },
  { href: "/minerals", label: "Mineral Analysis" },
  { href: "/rankings", label: "Rankings" },
  { href: "/correlations", label: "Correlations" },
  { href: "/volatility", label: "Volatility" },
  { href: "/anomalies", label: "Anomalies" },
  { href: "/statistics", label: "Statistics" },
  { href: "/explorer", label: "Data Explorer" },
  { href: "/methodology", label: "Data Quality & Methodology" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="flex h-12 items-center gap-2 border-b px-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <MenuIcon className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b">
            <SheetTitle className="flex items-center gap-2 text-sm">
              <InseauLogo size={18} />
              inseau
            </SheetTitle>
          </SheetHeader>
          <nav className="space-y-0.5 p-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2 text-sm font-medium",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <span className="text-sm font-semibold">inseau</span>
    </div>
  );
}
