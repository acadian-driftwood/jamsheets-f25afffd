import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Plane, MapPin } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type TravelType = "driving" | "flight" | "rental";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tourId: string;
  defaultDate?: string;
}

export function CreateTravelModal({ open, onOpenChange, tourId, defaultDate }: Props) {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const orgId = currentOrg?.organization.id;

  const [step, setStep] = useState<"type" | "form">("type");
  const [travelType, setTravelType] = useState<TravelType>("driving");
  const [tripType, setTripType] = useState<"one_way" | "round_trip">("one_way");
  const [saving, setSaving] = useState(false);

  // Common fields
  const [title, setTitle] = useState("");
  const [departureLocation, setDepartureLocation] = useState("");
  const [arrivalLocation, setArrivalLocation] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [arrivalTime, setArrivalTime] = useState("");
  const [notes, setNotes] = useState("");
  const [travelerName, setTravelerName] = useState("");

  // Flight-specific
  const [airline, setAirline] = useState("");
  const [confirmationNumber, setConfirmationNumber] = useState("");

  // Return leg fields (for round-trip)
  const [returnDepartureDate, setReturnDepartureDate] = useState("");
  const [returnDepartureTime, setReturnDepartureTime] = useState("");
  const [returnArrivalDate, setReturnArrivalDate] = useState("");
  const [returnArrivalTime, setReturnArrivalTime] = useState("");

  // Rental-specific
  const [rentalCompany, setRentalCompany] = useState("");
  const [rentalConfirmation, setRentalConfirmation] = useState("");

  const resetForm = () => {
    setStep("type");
    setTravelType("driving");
    setTripType("one_way");
    setTitle(""); setDepartureLocation(""); setArrivalLocation("");
    setDepartureDate(""); setDepartureTime(""); setArrivalDate(""); setArrivalTime("");
    setNotes(""); setTravelerName(""); setAirline(""); setConfirmationNumber("");
    setReturnDepartureDate(""); setReturnDepartureTime(""); setReturnArrivalDate(""); setReturnArrivalTime("");
    setRentalCompany(""); setRentalConfirmation("");
  };

  const handleClose = (v: boolean) => {
    if (!v) resetForm();
    onOpenChange(v);
  };

  const handleSelectType = (type: TravelType) => {
    setTravelType(type);
    setStep("form");
    if (type === "driving") setTitle("Drive");
    else if (type === "flight") setTitle("Flight");
    else setTitle("Rental Car");
  };

  const handleSubmit = async () => {
    if (!orgId || !departureDate) { toast.error("Date is required"); return; }
    setSaving(true);

    try {
      if (travelType === "driving") {
        await supabase.from("tour_timeline_items").insert({
          tour_id: tourId,
          organization_id: orgId,
          type: "driving" as any,
          title: title || "Drive",
          subtitle: departureLocation && arrivalLocation ? `${departureLocation} → ${arrivalLocation}` : undefined,
          date: departureDate,
          time_start: departureTime || null,
          time_end: arrivalTime || null,
          notes: notes || null,
          departure_location: departureLocation || null,
          arrival_location: arrivalLocation || null,
          traveler_name: travelerName || null,
          travel_subtype: "one_way",
        } as any).throwOnError();
      } else if (travelType === "flight") {
        const outbound = await supabase.from("tour_timeline_items").insert({
          tour_id: tourId,
          organization_id: orgId,
          type: "flight" as any,
          title: title || "Flight",
          subtitle: departureLocation && arrivalLocation ? `${departureLocation} → ${arrivalLocation}` : undefined,
          date: departureDate,
          time_start: departureTime || null,
          time_end: arrivalTime || null,
          notes: notes || null,
          departure_location: departureLocation || null,
          arrival_location: arrivalLocation || null,
          airline: airline || null,
          confirmation_number: confirmationNumber || null,
          traveler_name: travelerName || null,
          travel_subtype: tripType,
        } as any).select().single().throwOnError();

        if (tripType === "round_trip" && returnDepartureDate) {
          await supabase.from("tour_timeline_items").insert({
            tour_id: tourId,
            organization_id: orgId,
            type: "flight" as any,
            title: `${title || "Flight"} (Return)`,
            subtitle: arrivalLocation && departureLocation ? `${arrivalLocation} → ${departureLocation}` : undefined,
            date: returnDepartureDate,
            time_start: returnDepartureTime || null,
            time_end: returnArrivalTime || null,
            notes: null,
            departure_location: arrivalLocation || null,
            arrival_location: departureLocation || null,
            airline: airline || null,
            confirmation_number: confirmationNumber || null,
            traveler_name: travelerName || null,
            travel_subtype: "round_trip",
            linked_item_id: outbound.data?.id || null,
          } as any).throwOnError();
        }
      } else {
        // Rental car
        const pickup = await supabase.from("tour_timeline_items").insert({
          tour_id: tourId,
          organization_id: orgId,
          type: "rental_pickup" as any,
          title: `${title || "Rental Car"} Pickup`,
          subtitle: departureLocation || undefined,
          date: departureDate,
          time_start: departureTime || null,
          time_end: null,
          notes: notes || null,
          departure_location: departureLocation || null,
          arrival_location: arrivalLocation || null,
          rental_company: rentalCompany || null,
          confirmation_number: rentalConfirmation || null,
          traveler_name: travelerName || null,
          travel_subtype: tripType,
        } as any).select().single().throwOnError();

        if (arrivalDate) {
          const dropoffType = tripType === "round_trip" ? "rental_return" : "rental_dropoff";
          await supabase.from("tour_timeline_items").insert({
            tour_id: tourId,
            organization_id: orgId,
            type: dropoffType as any,
            title: `${title || "Rental Car"} ${tripType === "round_trip" ? "Return" : "Dropoff"}`,
            subtitle: tripType === "round_trip" ? departureLocation || undefined : arrivalLocation || undefined,
            date: tripType === "round_trip" && returnDepartureDate ? returnDepartureDate : arrivalDate,
            time_start: tripType === "round_trip" && returnDepartureTime ? returnDepartureTime : arrivalTime || null,
            time_end: null,
            notes: null,
            departure_location: tripType === "round_trip" ? arrivalLocation || null : null,
            arrival_location: tripType === "round_trip" ? departureLocation || null : arrivalLocation || null,
            rental_company: rentalCompany || null,
            confirmation_number: rentalConfirmation || null,
            traveler_name: travelerName || null,
            travel_subtype: tripType,
            linked_item_id: pickup.data?.id || null,
          } as any).throwOnError();
        }
      }

      toast.success("Travel added to timeline");
      qc.invalidateQueries({ queryKey: ["tour-timeline", tourId] });
      qc.invalidateQueries({ queryKey: ["travel"] });
      handleClose(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to create travel item");
    } finally {
      setSaving(false);
    }
  };

  const showRoundTrip = travelType === "flight" || travelType === "rental";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === "type" ? "Add Travel" : `Add ${travelType === "driving" ? "Drive" : travelType === "flight" ? "Flight" : "Rental Car"}`}</DialogTitle>
        </DialogHeader>

        {step === "type" ? (
          <div className="grid gap-3 mt-2">
            <button onClick={() => handleSelectType("driving")} className="flex items-center gap-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors text-left">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div><p className="font-medium text-sm">Drive</p><p className="text-xs text-muted-foreground">Road travel between locations</p></div>
            </button>
            <button onClick={() => handleSelectType("flight")} className="flex items-center gap-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors text-left">
              <Plane className="h-5 w-5 text-muted-foreground" />
              <div><p className="font-medium text-sm">Flight</p><p className="text-xs text-muted-foreground">One-way or round-trip flights</p></div>
            </button>
            <button onClick={() => handleSelectType("rental")} className="flex items-center gap-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors text-left">
              <Car className="h-5 w-5 text-muted-foreground" />
              <div><p className="font-medium text-sm">Rental Car</p><p className="text-xs text-muted-foreground">Pickup and dropoff events</p></div>
            </button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {showRoundTrip && (
              <div>
                <label className="mb-1.5 block text-sm font-medium">Trip Type</label>
                <Select value={tripType} onValueChange={(v) => setTripType(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_way">One Way</SelectItem>
                    <SelectItem value="round_trip">Round Trip</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">Title</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={travelType === "driving" ? "Drive to venue" : travelType === "flight" ? "Flight to NYC" : "Rental Car"} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Traveler</label>
              <Input value={travelerName} onChange={e => setTravelerName(e.target.value)} placeholder="Who is traveling?" />
            </div>

            {travelType === "flight" && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Airline</label>
                  <Input value={airline} onChange={e => setAirline(e.target.value)} placeholder="e.g. Delta" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Confirmation #</label>
                  <Input value={confirmationNumber} onChange={e => setConfirmationNumber(e.target.value)} placeholder="ABC123" />
                </div>
              </>
            )}

            {travelType === "rental" && (
              <>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Rental Company</label>
                  <Input value={rentalCompany} onChange={e => setRentalCompany(e.target.value)} placeholder="e.g. Enterprise" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Confirmation #</label>
                  <Input value={rentalConfirmation} onChange={e => setRentalConfirmation(e.target.value)} placeholder="ABC123" />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{travelType === "rental" ? "Pickup Location" : "From"}</label>
                <Input value={departureLocation} onChange={e => setDepartureLocation(e.target.value)} placeholder={travelType === "flight" ? "Airport code" : "Location"} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">{travelType === "rental" ? "Dropoff Location" : "To"}</label>
                <Input value={arrivalLocation} onChange={e => setArrivalLocation(e.target.value)} placeholder={travelType === "flight" ? "Airport code" : "Location"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">{travelType === "rental" ? "Pickup Date" : "Departure Date"}</label>
                <Input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Time</label>
                <Input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
              </div>
            </div>

            {(travelType === "driving" || tripType === "one_way") && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">{travelType === "rental" ? "Dropoff Date" : "Arrival Date"}</label>
                  <Input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Time</label>
                  <Input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
                </div>
              </div>
            )}

            {showRoundTrip && tripType === "round_trip" && (
              <>
                <div className="border-t pt-4">
                  <p className="text-sm font-semibold mb-3">Return Leg</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Return Date</label>
                    <Input type="date" value={returnDepartureDate} onChange={e => setReturnDepartureDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Time</label>
                    <Input type="time" value={returnDepartureTime} onChange={e => setReturnDepartureTime(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Arrival Date</label>
                    <Input type="date" value={returnArrivalDate} onChange={e => setReturnArrivalDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">Time</label>
                    <Input type="time" value={returnArrivalTime} onChange={e => setReturnArrivalTime(e.target.value)} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium">Notes</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional details..." rows={2} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("type")} className="flex-1">Back</Button>
              <Button onClick={handleSubmit} disabled={saving || !departureDate} className="flex-1">
                {saving ? "Saving…" : "Add Travel"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
