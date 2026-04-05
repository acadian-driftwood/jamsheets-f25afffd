import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Map, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTours } from "@/hooks/useData";
import { CreateTourModal } from "@/components/modals/CreateTourModal";
import { format } from "date-fns";

export default function ToursPage() {
  const navigate = useNavigate();
  const { data: tours, isLoading } = useTours();
  const [showCreate, setShowCreate] = useState(false);

  const getStatus = (tour: any) => {
    if (tour.status === "archived") return { label: "Archived", variant: "muted" as const };
    if (tour.status === "completed") return { label: "Completed", variant: "muted" as const };
    if (tour.status === "draft") return { label: "Draft", variant: "warning" as const };
    return { label: "Active", variant: "success" as const };
  };

  const formatDates = (tour: any) => {
    if (!tour.start_date) return "No dates set";
    const start = format(new Date(tour.start_date + "T00:00:00"), "MMM d, yyyy");
    if (!tour.end_date) return `Starts ${start}`;
    const end = format(new Date(tour.end_date + "T00:00:00"), "MMM d, yyyy");
    return `${start} – ${end}`;
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Tours"
        action={
          <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New Tour
          </Button>
        }
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !tours || tours.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No tours yet"
          description="Create your first tour and start adding shows."
          action={
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> New Tour
            </Button>
          }
        />
      ) : (
        <div className="mt-6 space-y-3">
          {tours.map((tour) => {
            const status = getStatus(tour);
            return (
              <InfoCard
                key={tour.id}
                title={tour.name}
                subtitle={formatDates(tour)}
                onClick={() => navigate(`/tours/${tour.id}`)}
                chip={<StatusChip label={status.label} variant={status.variant} />}
              />
            );
          })}
        </div>
      )}

      <CreateTourModal open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
