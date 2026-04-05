import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plane, Clock, Car, MapPin } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

const typeLabel: Record<string, string> = {
  flight: "Flight", rental_pickup: "Pickup", rental_dropoff: "Dropoff", rental_return: "Return", driving: "Drive",
};

const typeVariant: Record<string, "accent" | "muted" | "warning"> = {
  flight: "accent", driving: "warning", rental_pickup: "muted", rental_dropoff: "muted", rental_return: "muted",
};

const typeIcon: Record<string, typeof Plane> = {
  flight: Plane, driving: MapPin, rental_pickup: Car, rental_dropoff: Car, rental_return: Car,
};

export default function TravelPage() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;
  const today = new Date().toISOString().split("T")[0];

  const { data: items, isLoading } = useQuery({
    queryKey: ["travel", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("tour_timeline_items")
        .select("*")
        .eq("organization_id", orgId)
        .in("type", ["flight", "rental_pickup", "rental_dropoff", "driving", "rental_return"])
        .gte("date", today)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Group by date
  const grouped = (items || []).reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date]!.push(item);
    return acc;
  }, {});

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Travel" subtitle="Upcoming flights, drives & rentals" />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="Nothing on the road yet"
          description="Travel items show up here when added to tours."
        />
      ) : (
        <div className="mt-5 space-y-4">
          {Object.entries(grouped).map(([date, dateItems]) => (
            <div key={date}>
              <p className="section-header mb-2">
                {format(parseISO(date + "T00:00:00"), "EEE, MMM d")}
              </p>
              <div className="space-y-2">
                {dateItems!.map((item) => {
                  const Icon = typeIcon[item.type] || Plane;
                  return (
                    <InfoCard
                      key={item.id}
                      icon={Icon}
                      title={item.title}
                      subtitle={item.subtitle || undefined}
                      chip={
                        <StatusChip
                          label={typeLabel[item.type] || item.type}
                          variant={typeVariant[item.type] || "muted"}
                        />
                      }
                    >
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {item.time_start && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.time_start}
                          </span>
                        )}
                        {item.confirmation_number && (
                          <span className="font-mono">#{item.confirmation_number}</span>
                        )}
                        {item.traveler_name && <span>{item.traveler_name}</span>}
                      </div>
                    </InfoCard>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
