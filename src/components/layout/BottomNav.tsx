import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Map, Music, Plane, Archive, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/today", label: "Today", icon: Calendar },
  { path: "/tours", label: "Tours", icon: Map },
  { path: "/shows", label: "Shows", icon: Music },
  { path: "/travel", label: "Travel", icon: Plane },
  { path: "/archive", label: "Archive", icon: Archive },
  { path: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-accent" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
