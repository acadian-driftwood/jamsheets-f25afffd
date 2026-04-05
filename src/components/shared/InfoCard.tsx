import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface InfoCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  chip?: React.ReactNode;
}

export function InfoCard({ title, subtitle, meta, onClick, children, className, chip }: InfoCardProps) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border bg-card p-4 text-left shadow-sm transition-colors",
        onClick && "active:bg-muted/50",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{title}</h3>
            {chip}
          </div>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground truncate">{subtitle}</p>}
          {meta && <p className="mt-1 text-xs text-muted-foreground">{meta}</p>}
        </div>
        {onClick && <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
      </div>
      {children}
    </Comp>
  );
}
