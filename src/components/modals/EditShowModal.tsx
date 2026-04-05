import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateShow, useTours } from "@/hooks/useData";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Show = Database["public"]["Tables"]["shows"]["Row"];

interface EditShowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  show: Show;
}

export function EditShowModal({ open, onOpenChange, show }: EditShowModalProps) {
  const [venue, setVenue] = useState(show.venue);
  const [city, setCity] = useState(show.city || "");
  const [date, setDate] = useState(show.date);
  const [address, setAddress] = useState(show.address || "");
  const [capacity, setCapacity] = useState(show.capacity?.toString() || "");
  const [notes, setNotes] = useState(show.notes || "");
  const [gearNotes, setGearNotes] = useState(show.gear_notes || "");
  const [tourId, setTourId] = useState(show.tour_id || "");
  const updateShow = useUpdateShow();
  const { data: tours } = useTours();

  useEffect(() => {
    setVenue(show.venue);
    setCity(show.city || "");
    setDate(show.date);
    setAddress(show.address || "");
    setCapacity(show.capacity?.toString() || "");
    setNotes(show.notes || "");
    setGearNotes(show.gear_notes || "");
    setTourId(show.tour_id || "");
  }, [show]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venue.trim() || !date) return;

    try {
      await updateShow.mutateAsync({
        id: show.id,
        venue: venue.trim(),
        city: city.trim() || null,
        date,
        address: address.trim() || null,
        tour_id: tourId || null,
        capacity: capacity ? parseInt(capacity) : null,
        notes: notes.trim() || null,
        gear_notes: gearNotes.trim() || null,
      });
      toast.success("Show updated");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to update show");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Show</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Venue</label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} className="h-11" autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">City</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Capacity</label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="h-11" />
            </div>
          </div>
          {tours && tours.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tour</label>
              <select
                value={tourId}
                onChange={(e) => setTourId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">No tour</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Gear Notes</label>
            <Textarea value={gearNotes} onChange={(e) => setGearNotes(e.target.value)} rows={3} />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={updateShow.isPending || !venue.trim() || !date}>
            {updateShow.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
