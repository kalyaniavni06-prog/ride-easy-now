import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; to: string } | undefined;
  secondary?: ReactNode;
  tone?: "default" | "danger";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondary,
  tone = "default",
}: EmptyStateProps) {
  return (
    <div className="surface-panel flex flex-col items-center justify-center px-6 py-16 text-center">
      <span
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl",
          tone === "danger"
            ? "border border-destructive/25 bg-destructive/10 text-destructive"
            : "border border-primary/20 bg-primary/10 text-primary",
        )}
      >
        <Icon className="size-7" aria-hidden />
      </span>

      <h2 className="mt-5 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">{description}</p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {action ? (
          <Button asChild className="shadow-sm">
            <Link to={action.to}>{action.label}</Link>
          </Button>
        ) : null}
        {secondary}
      </div>
    </div>
  );
}
