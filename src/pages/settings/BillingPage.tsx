import { PageHeader } from "@/components/layout/PageHeader";
import { CreditCard } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Billing" back />

      <div className="mt-6 px-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
          <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">Free Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            You're currently on the free plan. Paid plans with advanced features are coming soon.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Current Plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">Free — Unlimited tours & shows during beta</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Usage</p>
            <p className="text-xs text-muted-foreground mt-0.5">No limits during beta period</p>
          </div>
        </div>
      </div>
    </div>
  );
}
