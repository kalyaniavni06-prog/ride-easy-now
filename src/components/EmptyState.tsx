import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; to: string } | undefined;
  secondary?: ReactNode;
  tone?: "default" | "danger";
}

export function EmptyState({ icon: Icon, title, description, action, secondary, tone = "default" }: EmptyStateProps) {
  return (
    <div className="surface-panel flex flex-col items-center justify-center px-6 py-14 text-center">
      <span
        className={
          tone === "danger"
            ? "flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
            : "flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground"
        }
      >
        <Icon className="size-7" aria-hidden />
      </span>
      <h2 className="mt-5 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {action ? (
          <Button asChild>
            <Link to={action.to}>{action.label}</Link>
          </Button>
        ) : null}
        {secondary}
      </div>
    </div>
  );
}
