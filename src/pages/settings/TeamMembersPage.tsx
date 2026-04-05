import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Trash2, Send, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TeamMembersPage() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const orgId = currentOrg?.organization.id;
  const isAdmin = currentOrg && ["owner", "admin"].includes(currentOrg.role);
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const { data: members, isLoading } = useQuery({
    queryKey: ["org-members", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("organization_members")
        .select("*, profile:profiles!organization_members_user_id_fkey(full_name, avatar_url)")
        .eq("organization_id", orgId)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: pendingInvites } = useQuery({
    queryKey: ["org-invites", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("team_invites" as any)
        .select("*")
        .eq("organization_id", orgId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orgId,
  });

  const handleInvite = async () => {
    if (!inviteEmail || !orgId) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("team-invites", {
        body: {
          action: "send-invite",
          email: inviteEmail,
          role: inviteRole,
          organizationId: orgId,
          orgName: currentOrg?.organization.name,
          inviterName: user?.user_metadata?.full_name || user?.email,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success(`Invite sent to ${inviteEmail}`);
      setInviteEmail("");
      qc.invalidateQueries({ queryKey: ["org-invites"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const handleResend = async (inviteId: string, email: string) => {
    if (!orgId) return;
    setResendingId(inviteId);
    try {
      const { data, error } = await supabase.functions.invoke("team-invites", {
        body: {
          action: "resend-invite",
          inviteId,
          organizationId: orgId,
          orgName: currentOrg?.organization.name,
          inviterName: user?.user_metadata?.full_name || user?.email,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success(`Invite resent to ${email}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to resend invite");
    } finally {
      setResendingId(null);
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from the team?`)) return;
    const { error } = await supabase.from("organization_members").delete().eq("id", memberId);
    if (error) { toast.error("Failed to remove member"); return; }
    toast.success("Member removed");
    qc.invalidateQueries({ queryKey: ["org-members"] });
  };

  const roleColors: Record<string, "accent" | "success" | "warning" | "muted" | "destructive"> = {
    owner: "accent", admin: "success", tm: "warning", member: "muted", crew: "muted", readonly: "muted",
  };

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Team Members" back />

      {/* Invite form */}
      {isAdmin && (
        <div className="mt-4 mx-4 p-4 rounded-xl border bg-card shadow-sm space-y-3">
          <p className="text-sm font-medium">Invite a team member</p>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              className="flex-1"
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="tm">TM</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="crew">Crew</SelectItem>
                <SelectItem value="readonly">Read-only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleInvite} disabled={!inviteEmail || sending} className="w-full gap-2">
            <Send className="h-4 w-4" />
            {sending ? "Sending…" : "Send Invite"}
          </Button>
        </div>
      )}

      {/* Pending invites */}
      {pendingInvites && pendingInvites.length > 0 && (
        <div className="mt-4 mx-4">
          <p className="section-title">Pending Invites</p>
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            {pendingInvites.map((inv: any) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">Invited · {inv.role}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusChip label="Pending" variant="warning" />
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={resendingId === inv.id}
                      onClick={() => handleResend(inv.id, inv.email)}
                      title="Resend invite"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${resendingId === inv.id ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current members */}
      <div className="mt-4">
        <p className="section-title mx-4">Current Members</p>
        {isLoading ? (
          <div className="space-y-3 px-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />)}
          </div>
        ) : !members || members.length === 0 ? (
          <EmptyState icon={Users} title="No team members" description="Invite your band and crew." />
        ) : (
          <div className="mx-4 rounded-xl border bg-card shadow-sm overflow-hidden">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{(m as any).profile?.full_name || "Unknown"}</p>
                  <p className="text-xs text-muted-foreground">{m.user_id.slice(0, 8)}…</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusChip label={m.role} variant={roleColors[m.role] || "muted"} />
                  {isAdmin && m.role !== "owner" && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      onClick={() => handleRemove(m.id, (m as any).profile?.full_name || "this member")}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
