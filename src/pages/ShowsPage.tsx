import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Music, Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useShows } from "@/hooks/useData";
import { CreateShowModal } from "@/components/modals/CreateShowModal";
import { format, isToday, parseISO } from "date-fns";

export default function ShowsPage() {
  const navigate = useNavigate();
  const { data: shows, isLoading } = useShows();
  const [showCreate, setShowCreate] = useState(false);

  // Group shows by month
  const grouped = (shows || []).reduce<Record<string, typeof shows>>((acc, show) => {
    const key = format(parseISO(show.date + "T00:00:00"), "MMMM yyyy");
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(show);
    return acc;
  }, {});

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Shows"
        subtitle={shows ? `${shows.length} upcoming` : undefined}
        action={
          <Button size="sm" className="gap-1.5 h-9 rounded-xl text-xs" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" /> New Show
          </Button>
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : !shows || shows.length === 0 ? (
        <EmptyState
          icon={Music}
          title="No shows coming up"
          description="Add a show to start planning."
          action={
            <Button size="sm" className="rounded-xl" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Show
            </Button>
          }
        />
      ) : (
        <div className="mt-5 space-y-5">
          {Object.entries(grouped).map(([month, monthShows]) => (
            <div key={month}>
              <p className="section-header mb-2.5">{month}</p>
              <div className="space-y-2">
                {monthShows!.map((show) => {
                  const showDate = parseISO(show.date + "T00:00:00");
                  const today = isToday(showDate);
                  return (
                    <InfoCard
                      key={show.id}
                      title={show.venue}
                      subtitle={show.city || undefined}
                      onClick={() => navigate(`/shows/${show.id}`)}
                      accentLeft={today}
                      chip={today ? <StatusChip label="Today" variant="accent" /> : undefined}
                    >
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(showDate, "EEE, MMM d")}
                        </span>
                        {show.capacity && <span>· {show.capacity.toLocaleString()} cap</span>}
                      </div>
                    </InfoCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateShowModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
