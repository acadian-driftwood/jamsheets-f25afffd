import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase establishes a recovery session from the URL hash automatically.
    // Listen for it, and also check current session as a fallback.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setHasSession(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession((prev) => prev ?? !!session);
    });
    // Give the SDK a moment to parse the hash before declaring failure
    const t = setTimeout(() => setHasSession((prev) => prev ?? false), 1500);
    return () => {
      subscription.unsubscribe();
      clearTimeout(t);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate("/today", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Couldn't update password");
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
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="mt-1 text-sm text-muted-foreground">Choose a new password for your account.</p>
        </div>

        {hasSession === false ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              This reset link is invalid or has expired.
            </p>
            <Button className="h-11 w-full" onClick={() => navigate("/login")}>
              Back to sign in
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">New Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
                minLength={8}
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="h-11"
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="h-11 w-full font-semibold" disabled={loading || hasSession === null}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
