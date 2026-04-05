import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface InfoCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  chip?: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  accentLeft?: boolean;
}

export function InfoCard({ title, subtitle, meta, onClick, children, className, chip, icon: Icon, iconColor, accentLeft }: InfoCardProps) {
  const Comp = onClick ? "button" : "div";

  return (
    <Comp
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border bg-card p-4 text-left shadow-sm transition-all press-scale",
        onClick && "active:bg-muted/40",
        accentLeft && "border-l-2 border-l-accent",
        className
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={cn("mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-muted shrink-0", iconColor)}>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{title}</h3>
            {chip}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground truncate">{subtitle}</p>}
          {meta && <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>}
          {children}
        </div>
        {onClick && <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/50" />}
      </div>
    </Comp>
  );
}
