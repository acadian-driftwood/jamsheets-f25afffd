import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: React.ReactNode;
  className?: string;
  size?: "default" | "hero";
  sticky?: boolean;
}

export function PageHeader({ title, subtitle, back, action, className, size = "default", sticky }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "flex items-center justify-between py-3",
        sticky && "sticky top-0 z-40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 -mx-5 px-5",
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0">
          <h1
            className={cn(
              "font-bold tracking-tight truncate",
              size === "hero" ? "text-3xl font-extrabold" : "text-xl"
            )}
          >
            {title}
          </h1>
          {subtitle && (
            <p className={cn(
              "text-muted-foreground truncate",
              size === "hero" ? "text-sm mt-0.5" : "text-xs"
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 ml-2">{action}</div>}
    </div>
  );
}
