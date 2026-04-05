import { PageHeader } from "@/components/layout/PageHeader";
import { useSubscription, PLAN_LIMITS, PlanTier } from "@/hooks/useSubscription";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Sparkles, CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const PLANS: { tier: PlanTier; features: string[]; recommended?: boolean }[] = [
  {
    tier: "free",
    features: [
      "1 workspace",
      "Up to 3 team members",
      "1 active tour",
      "Basic show management",
    ],
  },
  {
    tier: "band",
    recommended: true,
    features: [
      "1 workspace",
      "Up to 10 team members",
      "Unlimited tours & shows",
      "Full schedule, hotel, contacts, guest list",
      "Gear notes & operations",
      "Team roles & permissions",
    ],
  },
  {
    tier: "manager",
    features: [
      "Multiple workspaces",
      "Up to 25 team members",
      "Unlimited tours & shows",
      "Everything in Band",
      "Advanced admin controls",
      "Multi-band management",
    ],
  },
];

export default function BillingPage() {
  const { subscription, plan, isActive, isLoading } = useSubscription();
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const [changingTo, setChangingTo] = useState<PlanTier | null>(null);
  const orgId = currentOrg?.organization.id;
  const isOwnerOrAdmin = currentOrg && ["owner", "admin"].includes(currentOrg.role);

  const handleChangePlan = async (newTier: PlanTier) => {
    if (!orgId || !isOwnerOrAdmin) return;
    if (newTier === plan) return;

    // For non-free plans, this is where Stripe checkout would happen
    if (newTier !== "free") {
      // Mock: simulate a "checkout" by updating the subscription directly
      const confirmed = confirm(
        `Upgrade to ${PLAN_LIMITS[newTier].label} ($${PLAN_LIMITS[newTier].price}/mo)?\n\nNote: Stripe integration coming soon. This will activate the plan immediately for now.`
      );
      if (!confirmed) return;
    } else {
      const confirmed = confirm("Downgrade to Free? You'll lose access to paid features.");
      if (!confirmed) return;
    }

    setChangingTo(newTier);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan_tier: newTier,
          status: "active",
          stripe_customer_id: newTier !== "free" ? `cus_mock_${orgId?.slice(0, 8)}` : null,
          stripe_subscription_id: newTier !== "free" ? `sub_mock_${Date.now()}` : null,
          current_period_end: newTier !== "free"
            ? new Date(Date.now() + 30 * 86400000).toISOString()
            : null,
        })
        .eq("organization_id", orgId);
      if (error) throw error;
      toast.success(`Plan changed to ${PLAN_LIMITS[newTier].label}`);
      qc.invalidateQueries({ queryKey: ["subscription"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to change plan");
    } finally {
      setChangingTo(null);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container animate-fade-in">
        <PageHeader title="Billing" back />
        <div className="mt-6 px-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Billing" back />

      <div className="mt-4 px-4 space-y-4">
        {/* Current plan summary */}
        <div className="card-elevated flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <CreditCard className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">
              {PLAN_LIMITS[plan].label} Plan
            </p>
            <p className="text-xs text-muted-foreground">
              {plan === "free"
                ? "No payment required"
                : `$${PLAN_LIMITS[plan].price}/month`}
              {subscription?.current_period_end &&
                ` · Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`}
            </p>
          </div>
          {plan !== "free" && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>

        {/* Plan cards */}
        <div className="space-y-3">
          {PLANS.map(({ tier, features, recommended }) => {
            const info = PLAN_LIMITS[tier];
            const isCurrent = tier === plan;
            const isDowngrade = (tier === "free" && plan !== "free") || (tier === "band" && plan === "manager");

            return (
              <div
                key={tier}
                className={`rounded-2xl border p-5 space-y-3 transition-all ${
                  isCurrent
                    ? "border-primary bg-primary/5 shadow-sm"
                    : recommended
                    ? "border-primary/30 shadow-sm"
                    : "bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base">{info.label}</h3>
                      {recommended && !isCurrent && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground bg-muted px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-extrabold mt-0.5">
                      {info.price === 0 ? "Free" : `$${info.price}`}
                      {info.price > 0 && (
                        <span className="text-xs font-normal text-muted-foreground">/month</span>
                      )}
                    </p>
                  </div>
                </div>

                <ul className="space-y-1.5">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {isOwnerOrAdmin && !isCurrent && (
                  <Button
                    variant={isDowngrade ? "outline" : "default"}
                    size="sm"
                    className="w-full gap-2"
                    disabled={changingTo !== null}
                    onClick={() => handleChangePlan(tier)}
                  >
                    {changingTo === tier ? (
                      "Processing…"
                    ) : isDowngrade ? (
                      "Downgrade"
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Upgrade to {info.label}
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Billing portal placeholder */}
        {plan !== "free" && isOwnerOrAdmin && (
          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl border p-3 text-xs text-muted-foreground transition-colors active:bg-muted/40"
            onClick={() => toast.info("Billing portal coming soon with Stripe integration.")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Manage billing & invoices
          </button>
        )}
      </div>
    </div>
  );
}
