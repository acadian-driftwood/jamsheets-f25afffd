import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plane, Car, MapPin, Coffee, Clock, Hash, User, FileText, Globe } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { getTimezoneAbbr, formatTimeInZone } from "@/lib/timezones";

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

export default function TravelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const [deleting, setDeleting] = useState(false);

  const isPrivileged = currentOrg && ["owner", "admin", "tm"].includes(currentOrg.role);

  const { data: item, isLoading } = useQuery({
    queryKey: ["timeline-item", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tour_timeline_items")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleDelete = async () => {
    if (!item || !confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      // Delete linked items (e.g. return legs)
      await supabase.from("tour_timeline_items").delete().eq("linked_item_id", item.id);
      // If this item is linked to another, delete that link's other items too
      if (item.linked_item_id) {
        await supabase.from("tour_timeline_items").delete().eq("id", item.linked_item_id);
      }
      await supabase.from("tour_timeline_items").delete().eq("id", item.id).throwOnError();
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["tour-timeline"] });
      qc.invalidateQueries({ queryKey: ["travel"] });
      navigate(-1);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
      setDeleting(false);
    }
  };

  const typeIcon = (type: string) => {
    if (type === "flight") return Plane;
    if (type === "driving") return MapPin;
    if (type === "off_day") return Coffee;
    return Car;
  };

  if (isLoading) {
    return (
      <div className="page-container animate-fade-in">
        <PageHeader title="Loading…" back sticky />
        <div className="space-y-2 mt-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page-container animate-fade-in">
        <PageHeader title="Not Found" back sticky />
        <p className="text-sm text-muted-foreground mt-4">This item could not be found.</p>
      </div>
    );
  }

  const Icon = typeIcon(item.type);
  const formattedDate = (() => {
    try { return format(parseISO(item.date + "T00:00:00"), "EEE, MMM d, yyyy"); } catch { return item.date; }
  })();

  return (
    <div className="page-container animate-fade-in pb-20">
      <PageHeader title={item.title} subtitle={formattedDate} back sticky />

      <div className="mt-4 rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium capitalize">{item.type.replace(/_/g, " ")}</span>
        </div>

        <div className="divide-y divide-border">
          {item.departure_location && (
            <InfoRow icon={MapPin} label="From" value={item.departure_location} />
          )}
          {item.arrival_location && (
            <InfoRow icon={MapPin} label="To" value={item.arrival_location} />
          )}
          {item.time_start && (
            <InfoRow icon={Clock} label="Departure Time" value={`${formatTimeInZone(item.time_start, (item as any).departure_timezone || "")}${(item as any).departure_timezone ? ` ${getTimezoneAbbr((item as any).departure_timezone)}` : ""}`} />
          )}
          {item.time_end && (
            <InfoRow icon={Clock} label="Arrival Time" value={`${formatTimeInZone(item.time_end, (item as any).arrival_timezone || "")}${(item as any).arrival_timezone ? ` ${getTimezoneAbbr((item as any).arrival_timezone)}` : ""}`} />
          )}
          {item.airline && (
            <InfoRow icon={Plane} label="Airline" value={item.airline} />
          )}
          {item.rental_company && (
            <InfoRow icon={Car} label="Rental Company" value={item.rental_company} />
          )}
          {item.confirmation_number && (
            <InfoRow icon={Hash} label="Confirmation #" value={item.confirmation_number} />
          )}
          {item.traveler_name && (
            <InfoRow icon={User} label="Traveler" value={item.traveler_name} />
          )}
          {item.notes && (
            <InfoRow icon={FileText} label="Notes" value={item.notes} />
          )}
        </div>
      </div>

      {/* Danger Zone */}
      {isPrivileged && (
        <section className="mt-10 rounded-2xl border border-destructive/20 p-4">
          <p className="text-xs font-semibold text-destructive mb-2">Danger Zone</p>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete this item and any linked items (e.g. return legs).
          </p>
          <Button
            size="sm"
            variant="destructive"
            className="rounded-xl text-xs"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </section>
      )}
    </div>
  );
}
