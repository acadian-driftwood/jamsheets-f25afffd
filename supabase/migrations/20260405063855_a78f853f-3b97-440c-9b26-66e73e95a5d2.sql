
-- 1. Fix team_invites token exposure: restrict SELECT to admins only
DROP POLICY IF EXISTS "Members can view invites" ON public.team_invites;

-- 2. Fix profiles broad exposure
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;

CREATE POLICY "Users can view org-scoped profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.organization_members om1
      JOIN public.organization_members om2
        ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid()
        AND om2.user_id = profiles.id
    )
  );

-- 3. Fix show-documents missing UPDATE policy
CREATE POLICY "Admin/TM can update show documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'show-documents' AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'tm')
  ));
