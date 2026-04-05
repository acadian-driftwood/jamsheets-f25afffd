import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateTour } from "@/hooks/useData";
import { useSubscription, useActiveTourCount } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/shared/UpgradePrompt";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CreateTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTourModal({ open, onOpenChange }: CreateTourModalProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");
  const createTour = useCreateTour();
  const { plan, limits } = useSubscription();
  const { data: activeTourCount = 0 } = useActiveTourCount();
  const atLimit = limits.activeTours !== Infinity && activeTourCount >= limits.activeTours;
  const navigate = useNavigate();

  const validate = () => {
    if (!startDate || !endDate) {
      setDateError("Both start and end dates are required");
      return false;
    }
    if (endDate < startDate) {
      setDateError("End date cannot be before start date");
      return false;
    }
    setDateError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !validate()) return;

    try {
      const tour = await createTour.mutateAsync({
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
      });
      toast.success("Tour created");
      setName("");
      setStartDate("");
      setEndDate("");
      setDateError("");
      onOpenChange(false);
      navigate(`/tours/${tour.id}`);
    } catch (err) {
      toast.error("Failed to create tour");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>New Tour</DialogTitle>
        </DialogHeader>
        {atLimit ? (
          <div className="pt-2">
            <UpgradePrompt feature="Creating more active tours" currentPlan={plan} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Tour Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. West Coast Summer 2025" className="h-11" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Start Date <span className="text-destructive">*</span></label>
                <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setDateError(""); }} className="h-11" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">End Date <span className="text-destructive">*</span></label>
                <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setDateError(""); }} className="h-11" />
              </div>
            </div>
            {dateError && <p className="text-xs text-destructive">{dateError}</p>}
            <Button type="submit" className="h-11 w-full" disabled={createTour.isPending || !name.trim() || !startDate || !endDate}>
              {createTour.isPending ? "Creating..." : "Create Tour"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
