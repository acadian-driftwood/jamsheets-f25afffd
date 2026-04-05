import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plane, Calendar } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

export default function TravelPage() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;

  const { data: items, isLoading } = useQuery({
    queryKey: ["travel", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("tour_timeline_items")
        .select("*")
        .eq("organization_id", orgId)
        .in("type", ["flight", "rental_pickup", "rental_dropoff"])
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Travel" subtitle="Flights & rental cars" />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={Plane}
          title="No travel yet"
          description="Travel items will appear here when added to tours."
        />
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <InfoCard
              key={item.id}
              title={item.title}
              subtitle={item.subtitle || undefined}
              chip={
                <StatusChip
                  label={item.type === "flight" ? "Flight" : item.type === "rental_pickup" ? "Pickup" : "Dropoff"}
                  variant={item.type === "flight" ? "accent" : "muted"}
                />
              }
            >
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(parseISO(item.date + "T00:00:00"), "MMM d")}
                </span>
                {item.time_start && <span>{item.time_start}</span>}
              </div>
            </InfoCard>
          ))}
        </div>
      )}
    </div>
  );
}
