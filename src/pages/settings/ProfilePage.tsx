import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) setFullName(data.full_name || "");
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() }).eq("id", user.id);
    setSaving(false);
    if (error) { toast.error("Failed to update profile"); return; }
    toast.success("Profile updated");
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageHeader title="Profile" back />
        <div className="mt-6 px-4 space-y-3">
          <div className="h-10 animate-pulse rounded bg-muted" />
          <div className="h-10 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Profile" back />

      <div className="mt-6 space-y-6 px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <User className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">{fullName || "No name set"}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Full Name</label>
          <Input value={fullName} onChange={e => setFullName(e.target.value)} className="h-11" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <Input value={user?.email || ""} disabled className="h-11 bg-muted" />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full h-11">
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
