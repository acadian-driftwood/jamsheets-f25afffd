DROP POLICY "Members can view their organizations" ON public.organizations;

CREATE POLICY "Members can view their organizations"
ON public.organizations
FOR SELECT TO authenticated
USING (is_org_member(auth.uid(), id));