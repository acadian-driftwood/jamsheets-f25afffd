import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { Archive, Calendar } from "lucide-react";

const demoArchived = [
  {
    id: "a1",
    venue: "Troubadour",
    city: "Los Angeles, CA",
    date: "May 10, 2025",
    tourName: "Spring Warmup",
  },
  {
    id: "a2",
    venue: "Bottom of the Hill",
    city: "San Francisco, CA",
    date: "May 8, 2025",
    tourName: "Spring Warmup",
  },
];

export default function ArchivePage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Archive" subtitle="Past shows" />

      {demoArchived.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No archived shows"
          description="Shows move here automatically 24 hours after the show date."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {demoArchived.map((show) => (
            <InfoCard
              key={show.id}
              title={show.venue}
              subtitle={show.city}
              meta={show.tourName}
              chip={<StatusChip label="Archived" variant="muted" />}
            >
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{show.date}</span>
              </div>
            </InfoCard>
          ))}
        </div>
      )}
    </div>
  );
}
