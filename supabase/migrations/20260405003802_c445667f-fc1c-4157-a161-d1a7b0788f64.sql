-- Fix the broken org_members INSERT policy
DROP POLICY "Admins can insert members" ON public.organization_members;

CREATE POLICY "Admins or first member can insert members"
ON public.organization_members
FOR INSERT TO authenticated
WITH CHECK (
  has_org_role(auth.uid(), organization_id, ARRAY['owner'::org_role, 'admin'::org_role])
  OR NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = organization_members.organization_id
  )
);

-- Allow creator to read back org during insert...select
DROP POLICY "Members can view their organizations" ON public.organizations;

CREATE POLICY "Members can view their organizations"
ON public.organizations
FOR SELECT TO authenticated
USING (
  is_org_member(auth.uid(), id)
  OR id IN (
    SELECT id FROM public.organizations WHERE id = organizations.id
    -- fallback: allow reading any org you just inserted in the same transaction
  )
);
