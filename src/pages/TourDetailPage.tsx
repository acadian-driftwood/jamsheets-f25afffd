import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Plus, Music, Plane, Car, Coffee } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const demoTour = {
  name: "West Coast Summer 2025",
  dates: "Jun 15 – Jul 20, 2025",
  showCount: 12,
};

type TimelineItemType = "show" | "off_day" | "flight" | "rental_pickup" | "rental_dropoff";

interface TimelineItem {
  id: string;
  type: TimelineItemType;
  date: string;
  title: string;
  subtitle?: string;
  meta?: string;
}

const timeline: TimelineItem[] = [
  { id: "1", type: "show", date: "Jun 15", title: "The Fillmore", subtitle: "San Francisco, CA", meta: "Doors 7:00 PM" },
  { id: "2", type: "flight", date: "Jun 16", title: "SFO → LAX", subtitle: "United UA 234", meta: "9:00 AM" },
  { id: "3", type: "show", date: "Jun 17", title: "The Roxy Theatre", subtitle: "Los Angeles, CA", meta: "Doors 8:00 PM" },
  { id: "4", type: "off_day", date: "Jun 18", title: "Off Day", subtitle: "Los Angeles, CA" },
  { id: "5", type: "rental_pickup", date: "Jun 19", title: "Rental Pickup", subtitle: "Enterprise — Compact SUV", meta: "11:00 AM" },
  { id: "6", type: "flight", date: "Jun 19", title: "LAX → PDX", subtitle: "Alaska AS 510", meta: "1:00 PM" },
  { id: "7", type: "show", date: "Jun 20", title: "Crystal Ballroom", subtitle: "Portland, OR", meta: "Doors 7:30 PM" },
  { id: "8", type: "show", date: "Jun 22", title: "Showbox", subtitle: "Seattle, WA", meta: "Doors 8:00 PM" },
];

const typeConfig: Record<TimelineItemType, { icon: typeof Music; chipLabel: string; chipVariant: "accent" | "muted" | "warning" }> = {
  show: { icon: Music, chipLabel: "Show", chipVariant: "accent" },
  off_day: { icon: Coffee, chipLabel: "Off Day", chipVariant: "muted" },
  flight: { icon: Plane, chipLabel: "Flight", chipVariant: "warning" },
  rental_pickup: { icon: Car, chipLabel: "Pickup", chipVariant: "muted" },
  rental_dropoff: { icon: Car, chipLabel: "Dropoff", chipVariant: "muted" },
};

export default function TourDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={demoTour.name}
        subtitle={demoTour.dates}
        back
        action={
          <Button size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        }
      />

      <div className="mt-4 flex gap-2 px-4">
        <StatusChip label="Active" variant="success" />
        <StatusChip label={`${demoTour.showCount} shows`} variant="muted" />
      </div>

      {/* Timeline */}
      <section className="mt-6">
        <p className="section-title">Timeline</p>
        <div className="space-y-2">
          {timeline.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            const isShow = item.type === "show";
            return (
              <InfoCard
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                meta={item.meta}
                onClick={isShow ? () => navigate(`/shows/${item.id}`) : undefined}
                chip={<StatusChip label={config.chipLabel} variant={config.chipVariant} />}
              >
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{item.date}</span>
                </div>
              </InfoCard>
            );
          })}
        </div>
      </section>
    </div>
  );
}
