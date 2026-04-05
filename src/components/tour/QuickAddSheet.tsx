import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Music, Plane, Car, MapPin, Coffee } from "lucide-react";

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  onSelect: (type: "show" | "flight" | "rental" | "driving" | "day_off") => void;
}

const options = [
  { type: "show" as const, label: "Show", icon: Music, description: "Add a gig or performance" },
  { type: "flight" as const, label: "Flight", icon: Plane, description: "One-way or round-trip flight" },
  { type: "rental" as const, label: "Rental Car", icon: Car, description: "Pickup and dropoff" },
  { type: "driving" as const, label: "Drive", icon: MapPin, description: "Road travel between locations" },
  { type: "day_off" as const, label: "Day Off", icon: Coffee, description: "Rest or free day" },
];

export function QuickAddSheet({ open, onOpenChange, date, onSelect }: QuickAddSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="text-left">Add to {date}</SheetTitle>
        </SheetHeader>
        <div className="grid gap-2 mt-4 pb-4">
          {options.map(({ type, label, icon: Icon, description }) => (
            <button
              key={type}
              onClick={() => { onSelect(type); onOpenChange(false); }}
              className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors text-left"
            >
              <Icon className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
