import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { Archive, Calendar } from "lucide-react";
import { useArchivedShows } from "@/hooks/useData";
import { format, parseISO } from "date-fns";

export default function ArchivePage() {
  const { data: shows, isLoading } = useArchivedShows();

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Archive" subtitle="Past shows" />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : !shows || shows.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No archived shows"
          description="Shows move here automatically 24 hours after the show date."
        />
      ) : (
        <div className="mt-6 space-y-3">
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
  );
}
