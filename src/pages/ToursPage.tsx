import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Map, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTours, useShows } from "@/hooks/useData";
import { CreateTourModal } from "@/components/modals/CreateTourModal";
import { format } from "date-fns";

export default function ToursPage() {
  const navigate = useNavigate();
  const { data: tours, isLoading } = useTours();
  const { data: allShows } = useShows();
  const [showCreate, setShowCreate] = useState(false);

  const getShowCount = (tourId: string) =>
    allShows?.filter((s) => s.tour_id === tourId).length || 0;

  const formatDates = (tour: any) => {
    if (!tour.start_date) return "No dates set";
    const start = format(new Date(tour.start_date + "T00:00:00"), "MMM d");
    if (!tour.end_date) return `Starts ${start}`;
    const end = format(new Date(tour.end_date + "T00:00:00"), "MMM d, yyyy");
    return `${start} – ${end}`;
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Tours"
        action={
          <Button size="sm" className="gap-1.5 h-9 rounded-xl text-xs" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5" /> New Tour
          </Button>
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : !tours || tours.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No active tours"
          description="Create a tour to start organizing your shows and travel."
          action={
            <Button size="sm" className="rounded-xl" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New Tour
            </Button>
          }
        />
      ) : (
        <div className="mt-5 space-y-2.5">
          {tours.map((tour) => {
            const showCount = getShowCount(tour.id);
            const isActive = tour.status === "active";
            return (
              <InfoCard
                key={tour.id}
                title={tour.name}
                subtitle={formatDates(tour)}
                onClick={() => navigate(`/tours/${tour.id}`)}
                accentLeft={isActive}
                chip={
                  <StatusChip
                    label={`${showCount} show${showCount !== 1 ? "s" : ""}`}
                    variant="muted"
                  />
                }
              />
            );
          })}
        </div>
      )}

      <CreateTourModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
