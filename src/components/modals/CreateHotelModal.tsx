import { useState, useEffect } from "react";
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
  defaultDate?: string;
}

export function CreateHotelModal({ open, onOpenChange, tourId, defaultDate }: Props) {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const orgId = currentOrg?.organization.id;

  const [hotelName, setHotelName] = useState("");
  const [checkIn, setCheckIn] = useState(defaultDate || "");
  const [checkOut, setCheckOut] = useState("");
  const [address, setAddress] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && defaultDate) setCheckIn(defaultDate);
  }, [open, defaultDate]);

  const reset = () => {
    setHotelName("");
    setCheckIn("");
    setCheckOut("");
    setAddress("");
    setConfirmation("");
    setNotes("");
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleSubmit = async () => {
    if (!orgId || !hotelName || !checkIn) {
      toast.error("Hotel name and check-in date are required");
      return;
    }
    setSaving(true);
    try {
      await supabase.from("tour_timeline_items").insert({
        tour_id: tourId,
        organization_id: orgId,
        type: "hotel" as any,
        title: hotelName,
        subtitle: address || null,
        date: checkIn,
        end_date: checkOut || null,
        confirmation_number: confirmation || null,
        notes: notes || null,
      } as any).throwOnError();

      toast.success("Hotel added");
      qc.invalidateQueries({ queryKey: ["tour-timeline", tourId] });
      handleClose(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to add hotel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Hotel</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Hotel Name</label>
            <Input value={hotelName} onChange={(e) => setHotelName(e.target.value)} placeholder="e.g. Marriott Downtown" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Check-in</label>
              <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Check-out</label>
              <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Address (optional)</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirmation # (optional)</label>
            <Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes (optional)</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
          <Button onClick={handleSubmit} disabled={saving || !hotelName || !checkIn} className="w-full">
            {saving ? "Saving…" : "Add Hotel"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
