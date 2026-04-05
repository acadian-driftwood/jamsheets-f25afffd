import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "magic">("login");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  if (user) {
    navigate("/today", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        toast.success("Magic link sent! Check your email.");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/today");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
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
          <h1 className="text-2xl font-bold">JamSheets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tour operations, simplified.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Full Name</label>
              <Input type="text" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11" />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <Input type="email" placeholder="you@band.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" required />
          </div>
          {mode !== "magic" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Password</label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" required />
            </div>
          )}
          <Button type="submit" className="h-11 w-full font-semibold" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Magic Link"}
          </Button>

          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {mode === "login" ? (
            <>
              <Button type="button" variant="outline" className="h-11 w-full" onClick={() => setMode("magic")}>
                Sign in with Magic Link
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <button type="button" onClick={() => setMode("signup")} className="font-medium text-accent hover:underline">Sign up</button>
              </p>
            </>
          ) : mode === "signup" ? (
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")} className="font-medium text-accent hover:underline">Sign in</button>
            </p>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              <button type="button" onClick={() => setMode("login")} className="font-medium text-accent hover:underline">Back to sign in</button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
