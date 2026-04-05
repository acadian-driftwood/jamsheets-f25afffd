import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateTour } from "@/hooks/useData";
import { toast } from "sonner";

interface EditTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tour: { id: string; name: string; start_date: string | null; end_date: string | null } | null;
}

export function EditTourModal({ open, onOpenChange, tour }: EditTourModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const updateTour = useUpdateTour();

  useEffect(() => {
    if (tour) {
      setName(tour.name);
      setStartDate(tour.start_date || "");
      setEndDate(tour.end_date || "");
    }
  }, [tour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tour || !name.trim()) return;

    try {
      await updateTour.mutateAsync({
        id: tour.id,
        name: name.trim(),
        start_date: startDate || null,
        end_date: endDate || null,
      });
      toast.success("Tour updated");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to update tour");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>Edit Tour</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tour Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. West Coast Summer 2025" className="h-11" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11" />
            </div>
          </div>
          <Button type="submit" className="h-11 w-full" disabled={updateTour.isPending || !name.trim()}>
            {updateTour.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
