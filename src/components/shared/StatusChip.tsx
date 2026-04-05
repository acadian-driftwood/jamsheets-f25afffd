import { cn } from "@/lib/utils";

type ChipVariant = "success" | "warning" | "accent" | "muted" | "destructive";

interface StatusChipProps {
  label: string;
  variant?: ChipVariant;
  className?: string;
}

const variantClasses: Record<ChipVariant, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  accent: "bg-accent/10 text-accent",
  muted: "bg-muted text-muted-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatusChip({ label, variant = "muted", className }: StatusChipProps) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", variantClasses[variant], className)}>
      {label}
    </span>
  );
}
