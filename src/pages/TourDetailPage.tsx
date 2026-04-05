import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditTourModal } from "@/components/modals/EditTourModal";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Music, Plane, Car, Coffee, MapPin, Pencil, ChevronRight, CalendarOff } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useShows, useTourTimeline } from "@/hooks/useData";
import { CreateShowModal } from "@/components/modals/CreateShowModal";
import { CreateTravelModal } from "@/components/modals/CreateTravelModal";
import { CreateDayOffModal } from "@/components/modals/CreateDayOffModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showTravel, setShowTravel] = useState(false);
  const [showDayOff, setShowDayOff] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const { currentOrg } = useOrg();
  const qc = useQueryClient();

  const isPrivileged = currentOrg && ["owner", "admin", "tm"].includes(currentOrg.role);

  const { data: tour } = useQuery({
    queryKey: ["tour", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("tours").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const deleteTour = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tours").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tours"] });
      toast.success("Tour deleted");
      navigate("/tours");
    },
  });

  const handleDelete = () => {
    if (!tour || !confirm(`Delete "${tour.name}" and all its shows? This cannot be undone.`)) return;
    deleteTour.mutate();
  };

  const { data: shows, isLoading: showsLoading } = useShows(id);
  const { data: timelineItems } = useTourTimeline(id!);

  type MergedItem = { id: string; type: string; date: string; title: string; subtitle?: string; timeStart?: string; showId?: string };
  const merged: MergedItem[] = [];

  shows?.forEach((s) => {
    merged.push({ id: s.id, type: "show", date: s.date, title: s.venue, subtitle: s.city || undefined, showId: s.id });
  });

  timelineItems?.forEach((t) => {
    merged.push({ id: t.id, type: t.type, date: t.date, title: t.title, subtitle: t.subtitle || undefined, timeStart: t.time_start || undefined });
  });

  merged.sort((a, b) => a.date.localeCompare(b.date));

  // Group by date
  const grouped = merged.reduce<Record<string, MergedItem[]>>((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const formatDates = () => {
    if (!tour?.start_date) return "";
    const start = format(parseISO(tour.start_date + "T00:00:00"), "MMM d");
    if (!tour?.end_date) return start;
    return `${start} – ${format(parseISO(tour.end_date + "T00:00:00"), "MMM d, yyyy")}`;
  };

  const dotColor = (type: string) => {
    if (type === "show") return "bg-accent";
    if (type === "flight") return "bg-accent/60";
    if (type === "driving") return "bg-warning";
    return "bg-muted-foreground/30";
  };

  const typeIcon = (type: string) => {
    if (type === "show") return Music;
    if (type === "flight") return Plane;
    if (type === "driving") return MapPin;
    if (type === "off_day") return Coffee;
    return Car;
  };

  const chipLabel = (type: string) => {
    if (type === "show") return "Show";
    if (type === "off_day") return "Day off";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const chipVariant = (type: string): "accent" | "warning" | "muted" => {
    if (type === "show" || type === "flight") return "accent";
    if (type === "driving") return "warning";
    return "muted";
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={tour?.name || "Tour"}
        subtitle={formatDates()}
        back
        sticky
        action={
          isPrivileged ? (
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowEdit(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 h-8 rounded-xl text-xs" onClick={() => setShowDayOff(true)}>
                <Coffee className="h-3 w-3" /> Day Off
              </Button>
              <Button size="sm" variant="outline" className="gap-1 h-8 rounded-xl text-xs" onClick={() => setShowTravel(true)}>
                <Plus className="h-3 w-3" /> Travel
              </Button>
              <Button size="sm" className="gap-1 h-8 rounded-xl text-xs" onClick={() => setShowCreate(true)}>
                <Plus className="h-3 w-3" /> Show
              </Button>
            </div>
          ) : (
            <Button size="sm" className="gap-1 h-8 rounded-xl text-xs" onClick={() => setShowCreate(true)}>
              <Plus className="h-3 w-3" /> Show
            </Button>
          )
        }

      <section className="mt-4">
        {showsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />)}
          </div>
        ) : merged.length === 0 ? (
          <EmptyState
            icon={Music}
            title="Nothing planned yet"
            description="Add shows and travel to build your tour timeline."
            action={
              <Button size="sm" className="rounded-xl" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Show
              </Button>
            }
          />
        ) : (
          <div className="space-y-0">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                {/* Date divider */}
                <p className="date-divider">
                  {format(parseISO(date + "T00:00:00"), "EEE, MMM d")}
                </p>

                {/* Timeline items */}
                <div className="relative ml-3 border-l border-border pl-5 space-y-2 pb-4">
                  {items.map((item) => {
                    const Icon = typeIcon(item.type);
                    const isShow = item.type === "show";
                    const isOffDay = item.type === "off_day";

                    return (
                      <div key={item.id} className="relative">
                        {/* Timeline dot */}
                        <span
                          className={cn(
                            "absolute -left-[calc(1.25rem+5px)] top-3 timeline-dot",
                            dotColor(item.type)
                          )}
                        />

                        {isOffDay ? (
                          <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                            <Coffee className="h-3.5 w-3.5" />
                            <span>Day off</span>
                          </div>
                        ) : (
                          <button
                            onClick={isShow ? () => navigate(`/shows/${item.showId}`) : undefined}
                            className={cn(
                              "w-full rounded-xl border bg-card p-3 text-left transition-all press-scale",
                              isShow && "active:bg-muted/40"
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold truncate">{item.title}</span>
                                  <StatusChip label={chipLabel(item.type)} variant={chipVariant(item.type)} />
                                </div>
                                {item.subtitle && (
                                  <p className="text-xs text-muted-foreground truncate mt-0.5">{item.subtitle}</p>
                                )}
                                {item.timeStart && (
                                  <p className="text-[11px] text-muted-foreground mt-0.5">{item.timeStart}</p>
                                )}
                              </div>
                              {isShow && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />}
                            </div>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Danger Zone */}
      {isPrivileged && tour && (
        <section className="mt-10 rounded-2xl border border-destructive/20 p-4">
          <p className="text-xs font-semibold text-destructive mb-2">Danger Zone</p>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete this tour and all its data.
          </p>
          <Button size="sm" variant="destructive" className="rounded-xl text-xs" onClick={handleDelete}>
            Delete Tour
          </Button>
        </section>
      )}

      <CreateShowModal open={showCreate} onOpenChange={setShowCreate} defaultTourId={id} />
      {id && <CreateTravelModal open={showTravel} onOpenChange={setShowTravel} tourId={id} />}
      {tour && <EditTourModal open={showEdit} onOpenChange={setShowEdit} tour={tour} />}
    </div>
  );
}
