import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS, PlanTier } from "@/hooks/useSubscription";

interface UpgradePromptProps {
  feature: string;
  currentPlan: PlanTier;
  requiredPlan?: PlanTier;
}

export function UpgradePrompt({ feature, currentPlan, requiredPlan }: UpgradePromptProps) {
  const navigate = useNavigate();
  const target = requiredPlan || (currentPlan === "free" ? "band" : "manager");
  const targetLabel = PLAN_LIMITS[target].label;
  const price = PLAN_LIMITS[target].price;

  return (
    <div className="rounded-2xl border bg-card p-6 text-center space-y-3">
      <Sparkles className="h-8 w-8 mx-auto text-primary" />
      <h3 className="font-semibold text-sm">Upgrade to {targetLabel}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {feature} requires the {targetLabel} plan (${price}/mo).
      </p>
      <Button size="sm" onClick={() => navigate("/settings/billing")} className="gap-2">
        <Sparkles className="h-3.5 w-3.5" />
        View Plans
      </Button>
    </div>
  );
}
