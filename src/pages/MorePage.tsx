import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useSubscription, PLAN_LIMITS } from "@/hooks/useSubscription";
import { OrgSwitcherSheet } from "@/components/modals/OrgSwitcherSheet";
import { ChevronRight, Archive, Settings, User, LogOut, Music, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function MorePage() {
  const { signOut, user } = useAuth();
  const { currentOrg, organizations } = useOrg();
  const { plan } = useSubscription();
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const hasMultipleOrgs = organizations.length > 1;
  const canSwitch = hasMultipleOrgs || plan === "manager";

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="More" />

      <div className="mt-4 space-y-6">
        {currentOrg && (
          <button
            onClick={canSwitch ? () => setSwitcherOpen(true) : undefined}
            className={`card-elevated flex w-full items-center gap-3 text-left ${canSwitch ? "active:bg-muted/40 cursor-pointer" : "cursor-default"}`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{currentOrg.organization.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {currentOrg.role} · {PLAN_LIMITS[plan].label}
              </p>
            </div>
            {canSwitch && <ChevronDown className="h-4 w-4 text-muted-foreground/50 shrink-0" />}
          </button>
        )}

        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <button
            onClick={() => navigate("/archive")}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-muted/40 border-b"
          >
            <Archive className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Archive</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-muted/40 border-b"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Settings</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={() => navigate("/settings/profile")}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-muted/40 border-b"
          >
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Profile</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          </button>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-muted/40"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm font-medium">Sign Out</span>
          </button>
        </div>

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          {user?.email}
        </p>
      </div>

      <OrgSwitcherSheet open={switcherOpen} onOpenChange={setSwitcherOpen} />
    </div>
  );
}
