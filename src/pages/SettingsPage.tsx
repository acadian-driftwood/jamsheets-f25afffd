import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { ChevronRight, User, CreditCard, Users, Shield, LogOut, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const { signOut, user } = useAuth();
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const role = currentOrg?.role;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const isOwnerOrAdmin = role === "owner" || role === "admin";
  const isOwnerAdminOrTm = isOwnerOrAdmin || role === "tm";

  const workspaceItems = [
    { icon: Music, label: "Band Settings", action: () => navigate("/settings/band"), visible: role === "owner" },
    { icon: Users, label: "Team Members", action: () => navigate("/settings/team"), visible: isOwnerOrAdmin },
    { icon: Shield, label: "Roles & Permissions", action: () => navigate("/settings/roles"), visible: isOwnerAdminOrTm },
    { icon: CreditCard, label: "Billing", action: () => navigate("/settings/billing"), visible: isOwnerOrAdmin },
  ].filter(item => item.visible);

  const settingsSections = [
    { title: "Workspace", items: workspaceItems },
    {
      title: "Account",
      items: [
        { icon: User, label: "Profile", action: () => navigate("/settings/profile"), visible: true },
        { icon: LogOut, label: "Sign Out", action: handleSignOut, visible: true },
      ],
    },
  ];

  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Settings" />

      <div className="mt-6 space-y-6">
        {currentOrg && (
          <div className="card-elevated flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Music className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold">{currentOrg.organization.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{currentOrg.role}</p>
            </div>
          </div>
        )}

        {settingsSections.map((section) => (
          <section key={section.title}>
            <p className="section-title">{section.title}</p>
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted/50 border-b last:border-b-0"
                >
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        ))}

        <p className="text-center text-xs text-muted-foreground pt-4">
          Signed in as {user?.email}
        </p>
      </div>
    </div>
  );
}
