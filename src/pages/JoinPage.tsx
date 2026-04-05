import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music } from "lucide-react";
import { toast } from "sonner";

export default function JoinPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { user, loading } = useAuth();
  const { refetch } = useOrg();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "joining" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Inline auth form state
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!token) setErrorMsg("No invite token provided.");
  }, [token]);

  // Auto-accept when user is authenticated and status is idle
  useEffect(() => {
    if (user && token && status === "idle") {
      handleJoin();
    }
  }, [user, token]);

  const handleJoin = async () => {
    if (!token) return;
    setStatus("joining");
    try {
      const { data, error } = await supabase.functions.invoke("team-invites", {
        body: { action: "accept-invite", token },
      });
      if (error) {
        if (error.message?.includes("non-2xx") || error.message?.includes("401")) {
          await supabase.auth.signOut();
          setStatus("idle");
          return;
        }
        throw error;
      }
      if (data?.error) { setErrorMsg(data.error); setStatus("error"); return; }
      await refetch();
      if (data?.organizationId) {
        localStorage.setItem("jamsheets_current_org", data.organizationId);
      }
      setStatus("success");
      setTimeout(() => navigate("/today"), 1500);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to join.");
      setStatus("error");
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        // Auto-confirm is enabled, so the session will be set immediately.
        // The useEffect watching `user` will trigger handleJoin automatically.
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // useEffect will trigger handleJoin
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Music className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold">Join a Team</h1>
        </div>

        {!token ? (
          <p className="text-center text-sm text-destructive">{errorMsg || "Invalid invite link."}</p>
        ) : status === "success" ? (
          <p className="text-center text-sm text-success">You've joined the team! Redirecting…</p>
        ) : status === "error" ? (
          <p className="text-center text-sm text-destructive">{errorMsg}</p>
        ) : status === "joining" ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
            <p className="text-sm text-muted-foreground">Joining team…</p>
          </div>
        ) : !user ? (
          /* Inline signup/login form */
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              {authMode === "signup"
                ? "Create an account to accept this invite."
                : "Sign in to accept this invite."}
            </p>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === "signup" && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Full Name</label>
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11"
                  />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="you@band.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" className="h-11 w-full font-semibold" disabled={authLoading}>
                {authLoading
                  ? "Please wait…"
                  : authMode === "signup"
                  ? "Create Account & Join"
                  : "Sign In & Join"}
              </Button>
            </form>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {authMode === "signup" ? (
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => setAuthMode("login")} className="font-medium text-accent hover:underline">
                  Sign in
                </button>
              </p>
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button type="button" onClick={() => setAuthMode("signup")} className="font-medium text-accent hover:underline">
                  Sign up
                </button>
              </p>
            )}
          </div>
        ) : (
          /* User is authenticated but join hasn't triggered yet */
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">You've been invited to join a team on JamSheets.</p>
            <Button onClick={handleJoin} disabled={status === "joining"} className="w-full">
              Accept Invite
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
