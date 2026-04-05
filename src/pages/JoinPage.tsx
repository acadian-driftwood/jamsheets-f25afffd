import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function JoinPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "joining" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) setErrorMsg("No invite token provided.");
  }, [token]);

  const handleJoin = async () => {
    if (!token) return;
    setStatus("joining");
    try {
      const { data, error } = await supabase.functions.invoke("team-invites", {
        body: { action: "accept-invite", token },
      });
      if (error) throw error;
      if (data?.error) { setErrorMsg(data.error); setStatus("error"); return; }
      setStatus("success");
      setTimeout(() => navigate("/today"), 1500);
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to join.");
      setStatus("error");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      </div>
    );
  }

  if (!user) {
    const redirectPath = `/join?token=${token}`;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <h1 className="text-xl font-semibold">Join a Team</h1>
          <p className="text-sm text-muted-foreground">Create an account or sign in to accept this invite.</p>
          <Button onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirectPath)}`)} className="w-full">
            Create Account / Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <h1 className="text-xl font-semibold">Join a Team</h1>
        {!token ? (
          <p className="text-sm text-destructive">{errorMsg || "Invalid invite link."}</p>
        ) : status === "success" ? (
          <p className="text-sm text-success">You've joined the team! Redirecting…</p>
        ) : status === "error" ? (
          <p className="text-sm text-destructive">{errorMsg}</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">You've been invited to join a team on JamSheets.</p>
            <Button onClick={handleJoin} disabled={status === "joining"} className="w-full">
              {status === "joining" ? "Joining…" : "Accept Invite"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
