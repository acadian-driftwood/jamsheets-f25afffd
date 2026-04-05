import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Calendar, Clock, Music, Hotel, Plane } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUpcomingShows } from "@/hooks/useData";
import { useOrg } from "@/contexts/OrgContext";
import { format, isToday, parseISO } from "date-fns";

export default function TodayPage() {
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const { data: shows, isLoading } = useUpcomingShows();

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
