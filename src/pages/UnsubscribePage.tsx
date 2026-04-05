import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`;
    fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
      .then(r => r.json())
      .then(d => {
        if (d.reason === "already_unsubscribed") setStatus("already");
        else if (d.valid) setStatus("valid");
        else setStatus("invalid");
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    try {
      const { data } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      setStatus(data?.success ? "success" : "error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <h1 className="text-xl font-semibold text-foreground">Email Preferences</h1>
        {status === "loading" && <p className="text-muted-foreground">Verifying…</p>}
        {status === "valid" && (
          <>
            <p className="text-muted-foreground text-sm">Would you like to unsubscribe from future emails?</p>
            <button onClick={handleUnsubscribe} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground">
              Confirm Unsubscribe
            </button>
          </>
        )}
        {status === "already" && <p className="text-muted-foreground text-sm">You've already unsubscribed.</p>}
        {status === "success" && <p className="text-sm text-success">You've been unsubscribed successfully.</p>}
        {status === "invalid" && <p className="text-sm text-destructive">Invalid or expired link.</p>}
        {status === "error" && <p className="text-sm text-destructive">Something went wrong. Please try again.</p>}
      </div>
    </div>
  );
}
