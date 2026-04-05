import { PageHeader } from "@/components/layout/PageHeader";
import { Shield } from "lucide-react";

const ROLES = [
  { name: "Owner", description: "Full access. Can manage billing, delete workspace, and manage all members." },
  { name: "Admin", description: "Can manage tours, shows, team members, and all settings except billing and workspace deletion." },
  { name: "Tour Manager (TM)", description: "Can create/edit tours, shows, schedule, hotels, contacts, documents, and approve guest list requests." },
  { name: "Member", description: "Can view all data, request guests, and add notes. Cannot create or delete tours/shows." },
  { name: "Crew", description: "Read access to tours, shows, and schedules. Can view hotel and contact info." },
  { name: "Read Only", description: "View-only access to all data. Cannot make any changes." },
];

export default function RolesPermissionsPage() {
  return (
    <div className="page-container animate-fade-in">
      <PageHeader title="Roles & Permissions" back />

      <div className="mt-6 space-y-3 px-4">
        {ROLES.map(role => (
          <div key={role.name} className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="font-semibold text-sm">{role.name}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{role.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
