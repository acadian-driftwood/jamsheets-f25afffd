import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Music } from "lucide-react";

export default function BandSettingsPage() {
  const { currentOrg, refetch } = useOrg();
  const [name, setName] = useState(currentOrg?.organization.name || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!currentOrg || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({ name: name.trim() })
      .eq("id", currentOrg.organization.id);
    setSaving(false);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Band name updated");
    refetch();
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Band Settings" back />
      <div className="mt-6 space-y-6 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Music className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold">{currentOrg?.organization.name}</p>
            <p className="text-xs text-muted-foreground">Slug: {currentOrg?.organization.slug}</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Band / Team Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} className="h-11" />
        </div>

        <Button onClick={handleSave} disabled={saving || !name.trim()} className="w-full h-11">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
