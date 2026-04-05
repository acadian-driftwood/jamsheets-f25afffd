import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type OrgRole = Database["public"]["Enums"]["org_role"];

interface OrgMemberInfo {
  organization: Organization;
  role: OrgRole;
}

interface OrgContextType {
  organizations: OrgMemberInfo[];
  currentOrg: OrgMemberInfo | null;
  setCurrentOrgId: (id: string) => void;
  loading: boolean;
  refetch: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType>({
  organizations: [],
  currentOrg: null,
  setCurrentOrgId: () => {},
  loading: true,
  refetch: async () => {},
});

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<OrgMemberInfo[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(() => {
    return localStorage.getItem("jamsheets_current_org");
  });
  const [loading, setLoading] = useState(true);

  const fetchOrgs = useCallback(async () => {
    if (!user) {
      setOrganizations([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("organization_members")
      .select("role, organization:organizations(*)")
      .eq("user_id", user.id);

    if (error) {
      console.error("Error fetching orgs:", error);
      setLoading(false);
      return;
    }

    const orgs: OrgMemberInfo[] = (data || [])
      .filter((d) => d.organization)
      .map((d) => ({
        organization: d.organization as Organization,
        role: d.role,
      }));

    setOrganizations(orgs);

    // Auto-select first org if none selected
    if (orgs.length > 0 && (!currentOrgId || !orgs.find((o) => o.organization.id === currentOrgId))) {
      const id = orgs[0].organization.id;
      setCurrentOrgId(id);
      localStorage.setItem("jamsheets_current_org", id);
    }

    setLoading(false);
  }, [user, currentOrgId]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const handleSetCurrentOrgId = (id: string) => {
    setCurrentOrgId(id);
    localStorage.setItem("jamsheets_current_org", id);
  };

  const currentOrg = organizations.find((o) => o.organization.id === currentOrgId) ?? organizations[0] ?? null;

  return (
    <OrgContext.Provider
      value={{
        organizations,
        currentOrg,
        setCurrentOrgId: handleSetCurrentOrgId,
        loading,
        refetch: fetchOrgs,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => useContext(OrgContext);
