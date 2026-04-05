import { PageHeader } from "@/components/layout/PageHeader";
import { useOrg } from "@/contexts/OrgContext";
import { ChevronRight, Users, Shield, CreditCard, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const role = currentOrg?.role;

  const isOwnerOrAdmin = role === "owner" || role === "admin";
  const isOwnerAdminOrTm = isOwnerOrAdmin || role === "tm";

  const items = [
    { icon: Music, label: "Band Settings", action: () => navigate("/settings/band"), visible: role === "owner" },
    { icon: Users, label: "Team Members", action: () => navigate("/settings/team"), visible: isOwnerOrAdmin },
    { icon: Shield, label: "Roles & Permissions", action: () => navigate("/settings/roles"), visible: isOwnerAdminOrTm },
    { icon: CreditCard, label: "Billing", action: () => navigate("/settings/billing"), visible: isOwnerOrAdmin },
  ].filter(item => item.visible);

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Settings" back />

      <div className="mt-4">
        {items.length > 0 && (
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            {items.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-muted/40 border-b last:border-b-0"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
