import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plane, Car, Calendar } from "lucide-react";

const demoTravel = [
  {
    id: "1",
    type: "flight" as const,
    title: "SFO → LAX",
    subtitle: "United UA 234",
    date: "Jun 16",
    time: "9:00 AM – 10:30 AM",
  },
  {
    id: "2",
    type: "rental" as const,
    title: "Rental Car Pickup",
    subtitle: "Enterprise — Compact SUV",
    date: "Jun 17",
    time: "11:00 AM",
  },
  {
    id: "3",
    type: "flight" as const,
    title: "LAX → PDX",
    subtitle: "Alaska AS 510",
    date: "Jun 19",
    time: "1:00 PM – 3:30 PM",
  },
  {
    id: "4",
    type: "rental" as const,
    title: "Rental Car Dropoff",
    subtitle: "Enterprise — Compact SUV",
    date: "Jun 19",
    time: "11:00 AM",
  },
];

export default function TravelPage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Travel" subtitle="Flights & rental cars" />

      {demoTravel.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No travel yet"
          description="Travel items will appear here when added to tours."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {demoTravel.map((item) => (
            <InfoCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              chip={
                <StatusChip
                  label={item.type === "flight" ? "Flight" : "Rental"}
                  variant={item.type === "flight" ? "accent" : "muted"}
                />
              }
            >
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {item.date}
                </span>
                <span>{item.time}</span>
              </div>
            </InfoCard>
          ))}
        </div>
      )}
    </div>
  );
}
