import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, description, badge, action, className }: Props) {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-4 border-b border-white/5", className)}>
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground/95">
            {title}
          </h1>
          {badge && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30">
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground text-sm font-normal max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2 flex-wrap">{action}</div>}
    </div>
  );
}
