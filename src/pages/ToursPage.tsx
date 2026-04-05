import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Map, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const demoTours = [
  {
    id: "1",
    name: "West Coast Summer 2025",
    dates: "Jun 15 – Jul 20, 2025",
    showCount: 12,
    status: "active" as const,
  },
  {
    id: "2",
    name: "Southwest Run",
    dates: "Aug 5 – Aug 18, 2025",
    showCount: 6,
    status: "upcoming" as const,
  },
];

export default function ToursPage() {
  const navigate = useNavigate();

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Tours"
        action={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Tour
          </Button>
        }
      />

      {demoTours.length === 0 ? (
        <EmptyState
          icon={Map}
          title="No tours yet"
          description="Create your first tour and start adding shows."
          action={
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Tour
            </Button>
          }
        />
      ) : (
        <div className="mt-6 space-y-3">
          {demoTours.map((tour) => (
            <InfoCard
              key={tour.id}
              title={tour.name}
              subtitle={tour.dates}
              meta={`${tour.showCount} shows`}
              onClick={() => navigate(`/tours/${tour.id}`)}
              chip={
                <StatusChip
                  label={tour.status === "active" ? "Active" : "Upcoming"}
                  variant={tour.status === "active" ? "success" : "muted"}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
