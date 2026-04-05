import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Lock } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

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

  const handleChangePassword = async () => {
    if (!newPassword) { toast.error("Please enter a new password"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) { toast.error(error.message || "Failed to change password"); return; }
    toast.success("Password changed successfully");
    setNewPassword("");
    setConfirmPassword("");
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

        {/* Change Password */}
        <div className="border-t pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Change Password</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button onClick={handleChangePassword} disabled={changingPassword} variant="outline" className="w-full h-11">
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
