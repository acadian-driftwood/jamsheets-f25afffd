import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Plus } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrgSwitcherSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrgSwitcherSheet({ open, onOpenChange }: OrgSwitcherSheetProps) {
  const { organizations, currentOrg, setCurrentOrgId, refetch } = useOrg();
  const { user } = useAuth();
  const { plan } = useSubscription();
  const [creating, setCreating] = useState(false);
  const [bandName, setBandName] = useState("");
  const [loading, setLoading] = useState(false);

  const isManager = plan === "manager";

  const handleSwitch = (orgId: string) => {
    setCurrentOrgId(orgId);
    onOpenChange(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bandName.trim() || !user) return;
    setLoading(true);

    try {
      const slug = bandName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const orgId = crypto.randomUUID();

      const { error: orgError } = await supabase
        .from("organizations")
        .insert({ id: orgId, name: bandName.trim(), slug: slug + "-" + Date.now().toString(36) });
      if (orgError) throw orgError;

      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({ organization_id: orgId, user_id: user.id, role: "owner" });
      if (memberError) throw memberError;

      await refetch();
      setCurrentOrgId(orgId);
      setBandName("");
      setCreating(false);
      toast.success(`"${bandName.trim()}" created!`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-safe">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-base">Your Bands</SheetTitle>
        </SheetHeader>

        <div className="space-y-1">
          {organizations.map((org) => {
            const isActive = org.organization.id === currentOrg?.organization.id;
            return (
              <button
                key={org.organization.id}
                onClick={() => handleSwitch(org.organization.id)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-muted/40 hover:bg-muted/60"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-sm font-bold">
                  {org.organization.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{org.organization.name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize">{org.role}</p>
                </div>
                {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>

        {isManager && !creating && (
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start gap-2 text-sm text-muted-foreground"
            onClick={() => setCreating(true)}
          >
            <Plus className="h-4 w-4" />
            Create New Band
          </Button>
        )}

        {creating && (
          <form onSubmit={handleCreate} className="mt-3 space-y-3">
            <Input
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="Band name"
              className="h-10"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setCreating(false); setBandName(""); }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={loading || !bandName.trim()}>
                {loading ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
