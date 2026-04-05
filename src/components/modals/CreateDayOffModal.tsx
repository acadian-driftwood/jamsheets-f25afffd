import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourId: string;
}

export function CreateDayOffModal({ open, onOpenChange, tourId }: Props) {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const orgId = currentOrg?.organization.id;

  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setDate("");
    setNotes("");
  };

  const handleClose = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!orgId || !date) {
      toast.error("Date is required");
      return;
    }
    setSaving(true);
    try {
      await supabase.from("tour_timeline_items").insert({
        tour_id: tourId,
        organization_id: orgId,
        type: "off_day" as any,
        title: "Day off",
        date,
        notes: notes || null,
      } as any).throwOnError();

      toast.success("Day off added");
      qc.invalidateQueries({ queryKey: ["tour-timeline", tourId] });
      handleClose(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to add day off");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Day Off</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes (optional)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Rest day in Nashville" rows={2} />
          </div>
          <Button onClick={handleSubmit} disabled={saving || !date} className="w-full">
            {saving ? "Saving…" : "Add Day Off"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
