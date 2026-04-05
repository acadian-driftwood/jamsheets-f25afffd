import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Music, Plus, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUpcomingShows } from "@/hooks/useData";
import { CreateShowModal } from "@/components/modals/CreateShowModal";
import { format, isToday, parseISO } from "date-fns";

export default function ShowsPage() {
  const navigate = useNavigate();
  const { data: shows, isLoading } = useUpcomingShows();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Shows"
        subtitle={shows ? `${shows.length} upcoming` : undefined}
        action={
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New Show
          </Button>
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !shows || shows.length === 0 ? (
        <EmptyState
          icon={Music}
          title="No upcoming shows"
          description="Create a show to start planning."
          action={
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New Show
            </Button>
          }
        />
      ) : (
        <div className="mt-6 space-y-3">
          {shows.map((show) => {
            const showDate = parseISO(show.date + "T00:00:00");
            const today = isToday(showDate);
            return (
              <InfoCard
                key={show.id}
                title={show.venue}
                subtitle={show.city || undefined}
                onClick={() => navigate(`/shows/${show.id}`)}
                chip={today ? <StatusChip label="Today" variant="accent" /> : undefined}
              >
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{format(showDate, "MMM d, yyyy")}</span>
                  {show.capacity && <span>· {show.capacity.toLocaleString()} cap</span>}
                </div>
              </InfoCard>
            );
          })}
        </div>
      )}

      <CreateShowModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
