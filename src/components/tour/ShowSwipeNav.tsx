import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useShows } from "@/hooks/useData";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShowSwipeNavProps {
  showId: string;
  tourId: string;
}

export function ShowSwipeNav({ showId, tourId }: ShowSwipeNavProps) {
  const navigate = useNavigate();
  const { data: tourShows } = useShows(tourId);

  const { currentIndex, total, prev, next } = useMemo(() => {
    if (!tourShows || tourShows.length <= 1) return { currentIndex: -1, total: 0, prev: null, next: null };
    const sorted = [...tourShows].sort((a, b) => a.date.localeCompare(b.date));
    const idx = sorted.findIndex((s) => s.id === showId);
    return {
      currentIndex: idx,
      total: sorted.length,
      prev: idx > 0 ? sorted[idx - 1] : null,
      next: idx < sorted.length - 1 ? sorted[idx + 1] : null,
    };
  }, [tourShows, showId]);

  if (currentIndex < 0 || total <= 1) return null;

  return (
    <div className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 mt-2">
      <button
        onClick={() => prev && navigate(`/shows/${prev.id}`, { replace: true })}
        className={cn(
          "flex items-center gap-1 text-xs font-medium transition-colors min-w-0 max-w-[35%]",
          prev ? "text-muted-foreground hover:text-foreground" : "invisible"
        )}
        disabled={!prev}
      >
        <ChevronLeft className="h-3 w-3 shrink-0" />
        <span className="truncate">{prev?.venue}</span>
      </button>

      <span className="text-[11px] text-muted-foreground font-medium shrink-0 px-2">
        {currentIndex + 1} of {total}
      </span>

      <button
        onClick={() => next && navigate(`/shows/${next.id}`, { replace: true })}
        className={cn(
          "flex items-center gap-1 text-xs font-medium transition-colors min-w-0 max-w-[35%]",
          next ? "text-muted-foreground hover:text-foreground" : "invisible"
        )}
        disabled={!next}
      >
        <span className="truncate">{next?.venue}</span>
        <ChevronRight className="h-3 w-3 shrink-0" />
      </button>
    </div>
  );
}
