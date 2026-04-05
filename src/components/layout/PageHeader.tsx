import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, back, action, className }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-2", className)}>
      <div className="flex items-center gap-3">
        {back && (
          <button onClick={() => navigate(-1)} className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
