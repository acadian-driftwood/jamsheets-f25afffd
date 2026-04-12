import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TIMEZONE_OPTIONS, getLocalTimezone } from "@/lib/timezones";

interface TravelItem {
  id: string;
  tour_id: string;
  type: string;
  title: string;
  date: string;
  departure_location?: string | null;
  arrival_location?: string | null;
  time_start?: string | null;
  time_end?: string | null;
  departure_timezone?: string | null;
  arrival_timezone?: string | null;
  airline?: string | null;
  rental_company?: string | null;
  confirmation_number?: string | null;
  traveler_name?: string | null;
  notes?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TravelItem;
}

export function EditTravelModal({ open, onOpenChange, item }: Props) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [departureLocation, setDepartureLocation] = useState("");
  const [arrivalLocation, setArrivalLocation] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [departureTimezone, setDepartureTimezone] = useState(getLocalTimezone());
  const [arrivalTimezone, setArrivalTimezone] = useState(getLocalTimezone());
  const [airline, setAirline] = useState("");
  const [rentalCompany, setRentalCompany] = useState("");
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [travelerName, setTravelerName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open && item) {
      setTitle(item.title || "");
      setDate(item.date || "");
      setDepartureLocation(item.departure_location || "");
      setArrivalLocation(item.arrival_location || "");
      setDepartureTime(item.time_start?.slice(0, 5) || "");
      setArrivalTime(item.time_end?.slice(0, 5) || "");
      setDepartureTimezone(item.departure_timezone || getLocalTimezone());
      setArrivalTimezone(item.arrival_timezone || getLocalTimezone());
      setAirline(item.airline || "");
      setRentalCompany(item.rental_company || "");
      setConfirmationNumber(item.confirmation_number || "");
      setTravelerName(item.traveler_name || "");
      setNotes(item.notes || "");
    }
  }, [open, item]);

  const isFlightType = item.type === "flight";
  const isRentalType = item.type?.startsWith("rental");

  const handleSave = async () => {
    if (!date) { toast.error("Date is required"); return; }
    setSaving(true);
    try {
      const subtitle = departureLocation && arrivalLocation ? `${departureLocation} → ${arrivalLocation}` : undefined;
      await supabase
        .from("tour_timeline_items")
        .update({
          title: title || item.title,
          date,
          subtitle,
          departure_location: departureLocation || null,
          arrival_location: arrivalLocation || null,
          time_start: departureTime || null,
          time_end: arrivalTime || null,
          departure_timezone: departureTimezone,
          arrival_timezone: arrivalTimezone,
          airline: isFlightType ? airline || null : undefined,
          rental_company: isRentalType ? rentalCompany || null : undefined,
          confirmation_number: confirmationNumber || null,
          traveler_name: travelerName || null,
          notes: notes || null,
        } as any)
        .eq("id", item.id)
        .throwOnError();

      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["tour-timeline"] });
      qc.invalidateQueries({ queryKey: ["travel"] });
      qc.invalidateQueries({ queryKey: ["timeline-item", item.id] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {item.type?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{isFlightType ? "Passenger" : "Title"}</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {!isFlightType && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">Traveler</label>
            <Input value={travelerName} onChange={e => setTravelerName(e.target.value)} placeholder="Who is traveling?" />
          </div>
          )}

          {isFlightType && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Airline</label>
                <Input value={airline} onChange={e => setAirline(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Confirmation #</label>
                <Input value={confirmationNumber} onChange={e => setConfirmationNumber(e.target.value)} />
              </div>
            </>
          )}

          {isRentalType && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Rental Company</label>
                <Input value={rentalCompany} onChange={e => setRentalCompany(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Confirmation #</label>
                <Input value={confirmationNumber} onChange={e => setConfirmationNumber(e.target.value)} />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">From</label>
              <Input value={departureLocation} onChange={e => setDepartureLocation(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">To</label>
              <Input value={arrivalLocation} onChange={e => setArrivalLocation(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Date</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Departure Time</label>
              <Input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Departure Time Zone</label>
            <select value={departureTimezone} onChange={e => setDepartureTimezone(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {TIMEZONE_OPTIONS.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Arrival Time</label>
              <Input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
            </div>
            <div className="flex items-end">
              {/* spacer */}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Arrival Time Zone</label>
            <select value={arrivalTimezone} onChange={e => setArrivalTimezone(e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {TIMEZONE_OPTIONS.map(tz => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Notes</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !date} className="flex-1">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
