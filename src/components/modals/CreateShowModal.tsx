import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateShow } from "@/hooks/useData";
import { useTours } from "@/hooks/useData";
import { toast } from "sonner";
import { TIMEZONE_OPTIONS, getLocalTimezone } from "@/lib/timezones";

interface CreateShowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTourId?: string;
  defaultDate?: string;
}

export function CreateShowModal({ open, onOpenChange, defaultTourId, defaultDate }: CreateShowModalProps) {
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [date, setDate] = useState(defaultDate || "");
  const [tourId, setTourId] = useState(defaultTourId || "");
  const [timezone, setTimezone] = useState(getLocalTimezone());

  useEffect(() => {
    if (open && defaultDate) setDate(defaultDate);
  }, [open, defaultDate]);
  const [capacity, setCapacity] = useState("");
  const createShow = useCreateShow();
  const { data: tours } = useTours();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!venue.trim() || !date) return;

    try {
      await createShow.mutateAsync({
        venue: venue.trim(),
        city: city.trim() || null,
        date,
        tour_id: tourId || null,
        capacity: capacity ? parseInt(capacity) : null,
        timezone,
      });
      toast.success("Show created");
      setVenue("");
      setCity("");
      setDate("");
      setCapacity("");
      setTimezone(getLocalTimezone());
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to create show");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>New Show</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Venue</label>
            <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. The Fillmore" className="h-11" autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">City</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. San Francisco, CA" className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Date</label>
              <Input type="date" value={date} onChange={(e) => { if (!defaultDate) setDate(e.target.value); }} readOnly={!!defaultDate} className={`h-11 ${defaultDate ? "bg-muted cursor-default" : ""}`} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Capacity</label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="1000" className="h-11" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Time Zone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          {tours && tours.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tour (optional)</label>
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
          <Button type="submit" className="h-11 w-full" disabled={createShow.isPending || !venue.trim() || !date}>
            {createShow.isPending ? "Creating..." : "Create Show"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
