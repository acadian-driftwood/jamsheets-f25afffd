import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function OnboardingPage() {
  const [bandName, setBandName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bandName.trim() || !user) return;
    setLoading(true);

    try {
      const slug = bandName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const orgId = crypto.randomUUID();
      
      // Create organization
      const { error: orgError } = await supabase
        .from("organizations")
        .insert({ id: orgId, name: bandName.trim(), slug: slug + "-" + Date.now().toString(36) });
      if (orgError) throw orgError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({ organization_id: org.id, user_id: user.id, role: "owner" });
      if (memberError) throw memberError;

      localStorage.setItem("jamsheets_current_org", org.id);
      toast.success(`"${bandName}" workspace created!`);
      navigate("/today");
    } catch (err: any) {
      toast.error(err.message || "Failed to create workspace");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Music className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Set Up Your Band</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create your workspace to get started.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Band / Team Name</label>
            <Input
              value={bandName}
              onChange={(e) => setBandName(e.target.value)}
              placeholder="e.g. The Midnight Riders"
              className="h-11"
              autoFocus
            />
          </div>
          <Button type="submit" className="h-11 w-full font-semibold" disabled={loading || !bandName.trim()}>
            {loading ? "Creating..." : "Create Workspace"}
          </Button>
        </form>
      </div>
    </div>
  );
}
