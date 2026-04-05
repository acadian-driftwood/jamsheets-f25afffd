import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, Clock, Music, Hotel, Plane, Car, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUpcomingShows } from "@/hooks/useData";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, parseISO } from "date-fns";

const travelTypeLabel: Record<string, string> = {
  flight: "Flight", driving: "Drive", rental_pickup: "Pickup", rental_dropoff: "Dropoff", rental_return: "Return",
};

export default function TodayPage() {
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;
  const { data: shows, isLoading } = useUpcomingShows();
  const today = new Date().toISOString().split("T")[0];

  const { data: todayTravel } = useQuery({
    queryKey: ["today-travel", orgId, today],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("tour_timeline_items")
        .select("*")
        .eq("organization_id", orgId)
        .eq("date", today)
        .in("type", ["flight", "rental_pickup", "rental_dropoff", "driving", "rental_return"])
        .order("time_start", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const todayShows = shows?.filter((s) => isToday(parseISO(s.date + "T00:00:00"))) || [];
  const nextShow = shows?.[0];

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Today"
        subtitle={format(new Date(), "EEEE, MMMM d")}
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {/* Today's Show(s) */}
          {todayShows.length > 0 ? (
            <section className="mt-6">
              <p className="section-title">Tonight</p>
              {todayShows.map((show) => (
                <InfoCard
                  key={show.id}
                  title={show.venue}
                  subtitle={show.city || undefined}
                  onClick={() => navigate(`/shows/${show.id}`)}
                  chip={<StatusChip label="Show Day" variant="accent" />}
                >
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {show.capacity && (
                      <span>{show.capacity.toLocaleString()} cap</span>
                    )}
                  </div>
                </InfoCard>
              ))}
            </section>
          ) : (
            <section className="mt-6">
              <p className="section-title">Tonight</p>
              <div className="card-elevated text-center py-8">
                <p className="text-sm text-muted-foreground">No show today</p>
              </div>
            </section>
          )}

          {/* Today's Travel */}
          {todayTravel && todayTravel.length > 0 && (
            <section className="mt-6">
              <p className="section-title">Travel Today</p>
              <div className="space-y-2">
                {todayTravel.map((item) => {
                  const Icon = item.type === "flight" ? Plane : item.type === "driving" ? MapPin : Car;
                  return (
                    <InfoCard
                      key={item.id}
                      title={item.title}
                      subtitle={item.subtitle || undefined}
                      chip={<StatusChip label={travelTypeLabel[item.type] || item.type} variant={item.type === "flight" ? "accent" : "muted"} />}
                    >
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {item.time_start && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{item.time_start}</span>}
                        {(item as any).traveler_name && <span>{(item as any).traveler_name}</span>}
                      </div>
                    </InfoCard>
                  );
                })}
              </div>
            </section>
          )}

          {/* Next Up */}
          {nextShow && !isToday(parseISO(nextShow.date + "T00:00:00")) && (
            <section className="mt-6">
              <p className="section-title">Next Up</p>
              <InfoCard
                title={nextShow.venue}
                subtitle={nextShow.city || undefined}
                meta={format(parseISO(nextShow.date + "T00:00:00"), "EEEE, MMM d")}
                onClick={() => navigate(`/shows/${nextShow.id}`)}
              />
            </section>
          )}

          {/* Quick Stats */}
          <section className="mt-6">
            <p className="section-title">Overview</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="card-elevated">
                <p className="text-2xl font-bold">{shows?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Upcoming shows</p>
              </div>
              <div className="card-elevated">
                <p className="text-2xl font-bold">{currentOrg?.organization.name || "—"}</p>
                <p className="text-xs text-muted-foreground">Current workspace</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
