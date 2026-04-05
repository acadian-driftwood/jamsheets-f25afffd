import { cn } from "@/lib/utils";

type ChipVariant = "success" | "warning" | "accent" | "muted" | "destructive";

interface StatusChipProps {
  label: string;
  variant?: ChipVariant;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<ChipVariant, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  accent: "bg-accent/10 text-accent",
  muted: "bg-muted text-muted-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

const dotColors: Record<ChipVariant, string> = {
  success: "bg-success",
  warning: "bg-warning",
  accent: "bg-accent",
  muted: "bg-muted-foreground/40",
  destructive: "bg-destructive",
};

export function StatusChip({ label, variant = "muted", className, dot }: StatusChipProps) {
  if (dot) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-[11px] text-muted-foreground", className)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />
        {label}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", variantClasses[variant], className)}>
      {label}
    </span>
  );
}
