import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Coffee, FileText } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export default function OffDayDetailPage() {
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

  const [notes, setNotes] = useState<string | null>(null);
  const displayNotes = notes ?? item?.notes ?? "";

  const saveNotes = useMutation({
    mutationFn: async (value: string) => {
      await supabase
        .from("tour_timeline_items")
        .update({ notes: value || null })
        .eq("id", id!)
        .throwOnError();
    },
    onSuccess: () => {
      toast.success("Notes saved");
      qc.invalidateQueries({ queryKey: ["timeline-item", id] });
      qc.invalidateQueries({ queryKey: ["tour-timeline"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const handleDelete = async () => {
    if (!item || !confirm("Delete this day off? This cannot be undone.")) return;
    setDeleting(true);
    try {
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

  const formattedDate = (() => {
    try { return format(parseISO(item.date + "T00:00:00"), "EEEE, MMM d, yyyy"); } catch { return item.date; }
  })();

  return (
    <div className="page-container animate-fade-in pb-20">
      <PageHeader title="Day Off" subtitle={formattedDate} back sticky />

      <div className="mt-4 rounded-2xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Coffee className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Day Off</span>
        </div>

        {/* Editable notes */}
        <div className="mt-2">
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-1.5">
            <FileText className="h-3 w-3" />
            Notes & Plans
          </label>
          {isPrivileged ? (
            <>
              <Textarea
                placeholder="Add plans, reminders, or notes for this day…"
                value={displayNotes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px] text-sm rounded-xl resize-none"
              />
              <Button
                size="sm"
                className="mt-2 rounded-xl text-xs"
                onClick={() => saveNotes.mutate(displayNotes)}
                disabled={saveNotes.isPending || displayNotes === (item.notes ?? "")}
              >
                {saveNotes.isPending ? "Saving…" : "Save Notes"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {item.notes || "No notes yet."}
            </p>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      {isPrivileged && (
        <section className="mt-10 rounded-2xl border border-destructive/20 p-4">
          <p className="text-xs font-semibold text-destructive mb-2">Danger Zone</p>
          <p className="text-xs text-muted-foreground mb-3">
            Permanently delete this day off from the tour.
          </p>
          <Button
            size="sm"
            variant="destructive"
            className="rounded-xl text-xs"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete Day Off"}
          </Button>
        </section>
      )}
    </div>
  );
}
