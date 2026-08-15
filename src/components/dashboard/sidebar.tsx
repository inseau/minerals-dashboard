"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboardIcon,
  TrendingUpIcon,
  GemIcon,
  Share2Icon,
  ActivityIcon,
  AlertTriangleIcon,
  SigmaIcon,
  TableIcon,
  FileTextIcon,
  Trophy,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { InseauLogo } from "@/components/inseau-logo";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboardIcon },
  { href: "/trends", label: "Market Trends", icon: TrendingUpIcon },
  { href: "/minerals", label: "Mineral Analysis", icon: GemIcon },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/correlations", label: "Correlations", icon: Share2Icon },
  { href: "/volatility", label: "Volatility", icon: ActivityIcon },
  { href: "/anomalies", label: "Anomalies", icon: AlertTriangleIcon },
  { href: "/statistics", label: "Statistics", icon: SigmaIcon },
  { href: "/explorer", label: "Data Explorer", icon: TableIcon },
  { href: "/methodology", label: "Data Quality & Methodology", icon: FileTextIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <InseauLogo size={26} className="shrink-0 text-sidebar-foreground" />
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold">inseau</span>
          <span className="text-[11px] text-muted-foreground">Critical Minerals Intelligence</span>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3 scrollbar-thin">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-3 text-[11px] text-muted-foreground">
        Data: Kaggle — sergionefedov/critical-minerals-and-rare-earths-20152026
      </div>
    </aside>
  );
}
