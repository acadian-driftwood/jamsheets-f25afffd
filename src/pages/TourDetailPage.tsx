import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { InfoCard } from "@/components/shared/InfoCard";
import { EditTourModal } from "@/components/modals/EditTourModal";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Calendar, Plus, Music, Plane, Car, Coffee, Trash2, MapPin } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useShows, useTourTimeline } from "@/hooks/useData";
import { CreateShowModal } from "@/components/modals/CreateShowModal";
import { CreateTravelModal } from "@/components/modals/CreateTravelModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export default function TourDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showTravel, setShowTravel] = useState(false);
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

  const typeIcons: Record<string, typeof Music> = {
    off_day: Coffee, flight: Plane, rental_pickup: Car, rental_dropoff: Car, driving: MapPin, rental_return: Car,
  };

  type MergedItem = { id: string; type: string; date: string; title: string; subtitle?: string; meta?: string; showId?: string };
  const merged: MergedItem[] = [];

  shows?.forEach((s) => {
    merged.push({ id: s.id, type: "show", date: s.date, title: s.venue, subtitle: s.city || undefined, showId: s.id });
  });

  timelineItems?.forEach((t) => {
    merged.push({ id: t.id, type: t.type, date: t.date, title: t.title, subtitle: t.subtitle || undefined, meta: t.time_start || undefined });
  });

  merged.sort((a, b) => a.date.localeCompare(b.date));

  const formatDates = () => {
    if (!tour?.start_date) return "";
    const start = format(parseISO(tour.start_date + "T00:00:00"), "MMM d, yyyy");
    if (!tour?.end_date) return start;
    return `${start} – ${format(parseISO(tour.end_date + "T00:00:00"), "MMM d, yyyy")}`;
  };

  const chipVariant = (type: string) => {
    if (type === "show") return "accent";
    if (type === "flight") return "accent";
    if (type === "driving") return "warning";
    return "muted";
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader
        title={tour?.name || "Tour"}
        subtitle={formatDates()}
        back
        action={
          <div className="flex gap-1">
            {isPrivileged && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowTravel(true)}>
                <Plus className="h-4 w-4" /> Travel
              </Button>
            )}
            <Button size="sm" className="gap-1.5" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" /> Show
            </Button>
            {isPrivileged && (
              <Button size="icon" variant="ghost" className="text-destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        }
      />

      {tour && (
        <div className="mt-2 flex gap-2 px-4">
          <StatusChip label={tour.status === "active" ? "Active" : tour.status} variant={tour.status === "active" ? "success" : "muted"} />
          <StatusChip label={`${shows?.length || 0} shows`} variant="muted" />
        </div>
      )}

      <section className="mt-6">
        <p className="section-title">Timeline</p>
        {showsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : merged.length === 0 ? (
          <EmptyState
            icon={Music}
            title="Empty timeline"
            description="Add shows and travel to build your tour timeline."
            action={<Button size="sm" onClick={() => setShowCreate(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Show</Button>}
          />
        ) : (
          <div className="space-y-2">
            {merged.map((item) => {
              const Icon = item.type === "show" ? Music : typeIcons[item.type] || Coffee;
              const chipLabel = item.type === "show" ? "Show" : item.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <InfoCard
                  key={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  meta={item.meta}
                  onClick={item.showId ? () => navigate(`/shows/${item.showId}`) : undefined}
                  chip={<StatusChip label={chipLabel} variant={chipVariant(item.type)} />}
                >
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(parseISO(item.date + "T00:00:00"), "MMM d")}</span>
                  </div>
                </InfoCard>
              );
            })}
          </div>
        )}
      </section>

      <CreateShowModal open={showCreate} onOpenChange={setShowCreate} defaultTourId={id} />
      {id && <CreateTravelModal open={showTravel} onOpenChange={setShowTravel} tourId={id} />}
    </div>
  );
}
