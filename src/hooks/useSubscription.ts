import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export type PlanTier = "free" | "band" | "manager";

export interface Subscription {
  id: string;
  organization_id: string;
  plan_tier: PlanTier;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export const PLAN_LIMITS = {
  free: { members: 3, activeTours: 1, workspaces: 1, label: "Free", price: 0 },
  band: { members: 10, activeTours: Infinity, workspaces: 1, label: "Band", price: 19 },
  manager: { members: 25, activeTours: Infinity, workspaces: Infinity, label: "Manager", price: 59 },
} as const;

export function useSubscription() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;

  const query = useQuery({
    queryKey: ["subscription", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("organization_id", orgId)
        .maybeSingle();
      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!orgId,
  });

  const plan = (query.data?.plan_tier || "free") as PlanTier;
  const limits = PLAN_LIMITS[plan];
  const isActive = query.data?.status === "active" || query.data?.status === "trialing";

  return {
    ...query,
    subscription: query.data,
    plan,
    limits,
    isActive,
    isPaid: plan !== "free",
  };
}

export function useOrgMemberCount() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;
  return useQuery({
    queryKey: ["org-member-count", orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count, error } = await supabase
        .from("organization_members")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!orgId,
  });
}

export function useActiveTourCount() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.organization.id;
  return useQuery({
    queryKey: ["active-tour-count", orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count, error } = await supabase
        .from("tours")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .in("status", ["active", "draft"]);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!orgId,
  });
}
