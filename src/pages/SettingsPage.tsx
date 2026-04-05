import { PageHeader } from "@/components/layout/PageHeader";
import { ChevronRight, User, CreditCard, Users, Shield, LogOut, Music } from "lucide-react";

const settingsSections = [
  {
    title: "Workspace",
    items: [
      { icon: Music, label: "Band Settings", path: "/settings/workspace" },
      { icon: Users, label: "Team Members", path: "/settings/team" },
      { icon: Shield, label: "Roles & Permissions", path: "/settings/roles" },
      { icon: CreditCard, label: "Billing", path: "/settings/billing" },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: User, label: "Profile", path: "/settings/profile" },
      { icon: LogOut, label: "Sign Out", path: "/logout" },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Settings" />

      <div className="mt-6 space-y-6">
        {/* Workspace Indicator */}
        <div className="card-elevated flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Music className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold">The Midnight Riders</p>
            <p className="text-xs text-muted-foreground">Pro Plan · 5 members</p>
          </div>
        </div>

        {settingsSections.map((section) => (
          <section key={section.title}>
            <p className="section-title">{section.title}</p>
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              {section.items.map((item, i) => (
                <button
                  key={item.label}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-muted/50 border-b last:border-b-0"
                >
                  <item.icon className="h-4.5 w-4.5 text-muted-foreground" />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
