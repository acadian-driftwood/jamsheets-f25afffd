import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { Archive, Calendar, Map } from "lucide-react";
import { useArchivedShows, useArchivedTours } from "@/hooks/useData";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function ArchivePage() {
  const { data: shows, isLoading: showsLoading } = useArchivedShows();
  const { data: tours, isLoading: toursLoading } = useArchivedTours();
  const navigate = useNavigate();
  const isLoading = showsLoading || toursLoading;

  const hasTours = tours && tours.length > 0;
  const hasShows = shows && shows.length > 0;
  const isEmpty = !hasTours && !hasShows;

  const formatTourDates = (tour: any) => {
    if (!tour.start_date) return "No dates set";
    const start = format(new Date(tour.start_date + "T00:00:00"), "MMM d, yyyy");
    if (!tour.end_date) return `Started ${start}`;
    const end = format(new Date(tour.end_date + "T00:00:00"), "MMM d, yyyy");
    return `${start} – ${end}`;
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Archive" subtitle="Past tours & shows" />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          icon={Archive}
          title="Nothing archived yet"
          description="Tours and shows move here automatically after they end."
        />
      ) : (
        <div className="mt-6 space-y-6">
          {hasTours && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Map className="h-4 w-4" /> Tours
              </h2>
              {tours.map((tour) => (
                <InfoCard
                  key={tour.id}
                  title={tour.name}
                  subtitle={formatTourDates(tour)}
                  onClick={() => navigate(`/tours/${tour.id}`)}
                  chip={<StatusChip label="Archived" variant="muted" />}
                />
              ))}
            </div>
          )}

          {hasShows && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Shows
              </h2>
              {shows.map((show) => (
                <InfoCard
                  key={show.id}
                  title={show.venue}
                  subtitle={show.city || undefined}
                  chip={<StatusChip label="Archived" variant="muted" />}
                >
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(parseISO(show.date + "T00:00:00"), "MMM d, yyyy")}</span>
                  </div>
                </InfoCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
