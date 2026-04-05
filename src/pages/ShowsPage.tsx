import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import { Music, Plus, MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const demoShows = [
  {
    id: "1",
    venue: "The Fillmore",
    city: "San Francisco, CA",
    date: "Jun 15",
    tourName: "West Coast Summer 2025",
    isToday: true,
  },
  {
    id: "2",
    venue: "The Roxy Theatre",
    city: "Los Angeles, CA",
    date: "Jun 17",
    tourName: "West Coast Summer 2025",
    isToday: false,
  },
  {
    id: "3",
    venue: "Crystal Ballroom",
    city: "Portland, OR",
    date: "Jun 20",
    tourName: "West Coast Summer 2025",
    isToday: false,
  },
  {
    id: "4",
    venue: "Showbox",
    city: "Seattle, WA",
    date: "Jun 22",
    tourName: "West Coast Summer 2025",
    isToday: false,
  },
];

export default function ShowsPage() {
  const navigate = useNavigate();

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Shows"
        subtitle={`${demoShows.length} upcoming`}
        action={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Show
          </Button>
        }
      />

      <div className="mt-6 space-y-3">
        {demoShows.map((show) => (
          <InfoCard
            key={show.id}
            title={show.venue}
            subtitle={show.city}
            meta={show.tourName}
            onClick={() => navigate(`/shows/${show.id}`)}
            chip={
              show.isToday ? (
                <StatusChip label="Today" variant="accent" />
              ) : undefined
            }
          >
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{show.date}</span>
            </div>
          </InfoCard>
        ))}
      </div>
    </div>
  );
}
