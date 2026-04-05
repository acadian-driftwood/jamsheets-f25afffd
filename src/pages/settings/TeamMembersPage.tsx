import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusChip } from "@/components/shared/StatusChip";
import { EmptyState } from "@/components/shared/EmptyState";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Users, Plus, Trash2, UserPlus } from "lucide-react";

export default function TeamMembersPage() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;
  const isAdmin = currentOrg && ["owner", "admin"].includes(currentOrg.role);
  const qc = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [adding, setAdding] = useState(false);

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

  // Note: full invite flow would require an edge function to send emails.
  // For now we show the member list and allow removing members.

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

      <div className="mt-6">
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

        <div className="mt-4 px-4">
          <p className="text-xs text-muted-foreground">
            To invite new members, share your workspace details and have them sign up. Full email invites coming soon.
          </p>
        </div>
      </div>
    </div>
  );
}
