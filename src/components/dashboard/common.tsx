"use client";

import * as React from "react";
import { InfoIcon, InboxIcon, Loader2Icon, TrendingDownIcon, TrendingUpIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-1">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}

export function KpiCard({
  title,
  value,
  unit,
  tooltip,
  trend,
  icon: Icon,
}: {
  title: string;
  value: string;
  unit?: string;
  tooltip: string;
  trend?: { value: string; positive: boolean } | null;
  icon?: LucideIcon;
}) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 pt-0">
        <CardTitle className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {Icon && <Icon className="size-3.5" />}
          {title}
        </CardTitle>
        <Tooltip>
          <TooltipTrigger asChild>
            <button aria-label={`About ${title}`} className="text-muted-foreground hover:text-foreground">
              <InfoIcon className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      </CardHeader>
      <CardContent className="px-4">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
        {trend && (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-xs font-medium",
              trend.positive ? "text-success" : "text-destructive"
            )}
          >
            {trend.positive ? (
              <TrendingUpIcon className="size-3.5" />
            ) : (
              <TrendingDownIcon className="size-3.5" />
            )}
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EmptyState({ message = "No data available for the selected filters." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-16 text-center">
      <InboxIcon className="size-8 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}

export function InlineSpinner() {
  return <Loader2Icon className="size-4 animate-spin text-muted-foreground" />;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("py-5", className)}>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
