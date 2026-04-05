import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { Clock, Music, Plane, Car, MapPin, Coffee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUpcomingShows } from "@/hooks/useData";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, parseISO, differenceInCalendarDays } from "date-fns";

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
  const nextShow = shows?.find((s) => !isToday(parseISO(s.date + "T00:00:00")));
  const upcomingCount = shows?.length || 0;

  const daysUntilNext = nextShow
    ? differenceInCalendarDays(parseISO(nextShow.date + "T00:00:00"), new Date())
    : null;

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title="Today"
        subtitle={format(new Date(), "EEEE, MMMM d")}
        size="hero"
      />

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-6">
          {/* Tonight */}
          <section>
            <p className="section-title">
              {todayShows.length > 0 ? "Tonight" : "Today"}
            </p>
            {todayShows.length > 0 ? (
              <div className="space-y-2">
                {todayShows.map((show) => (
                  <InfoCard
                    key={show.id}
                    icon={Music}
                    title={show.venue}
                    subtitle={show.city || undefined}
                    onClick={() => navigate(`/shows/${show.id}`)}
                    chip={<StatusChip label="Show Day" variant="accent" />}
                    accentLeft
                  >
                    {show.capacity && (
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {show.capacity.toLocaleString()} cap
                      </p>
                    )}
                  </InfoCard>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border bg-card p-6 text-center">
                <Coffee className="h-5 w-5 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Day off</p>
              </div>
            )}
          </section>

          {/* Travel Today */}
          {todayTravel && todayTravel.length > 0 && (
            <section>
              <p className="section-title">On the Road</p>
              <div className="space-y-2">
                {todayTravel.map((item) => {
                  const Icon = item.type === "flight" ? Plane : item.type === "driving" ? MapPin : Car;
                  return (
                    <InfoCard
                      key={item.id}
                      icon={Icon}
                      title={item.title}
                      subtitle={item.subtitle || undefined}
                      chip={
                        <StatusChip
                          label={travelTypeLabel[item.type] || item.type}
                          variant={item.type === "flight" ? "accent" : "muted"}
                        />
                      }
                    >
                      {item.time_start && (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {item.time_start}
                        </p>
                      )}
                    </InfoCard>
                  );
                })}
              </div>
            </section>
          )}

          {/* Next Up */}
          {nextShow && (
            <section>
              <p className="section-title">Next Up</p>
              <InfoCard
                icon={Music}
                title={nextShow.venue}
                subtitle={nextShow.city || undefined}
                meta={format(parseISO(nextShow.date + "T00:00:00"), "EEEE, MMM d")}
                onClick={() => navigate(`/shows/${nextShow.id}`)}
                chip={
                  daysUntilNext !== null ? (
                    <StatusChip
                      label={daysUntilNext === 1 ? "Tomorrow" : `In ${daysUntilNext} days`}
                      variant="muted"
                    />
                  ) : undefined
                }
              />
            </section>
          )}

          {/* Overview */}
          <section>
            <p className="section-title">Overview</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="card-elevated">
                <p className="text-2xl font-bold tabular-nums">{upcomingCount}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Upcoming shows</p>
              </div>
              <div className="card-elevated">
                <p className="text-2xl font-bold tabular-nums">
                  {todayTravel?.length || 0}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Travel today</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
