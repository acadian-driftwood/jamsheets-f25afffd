
CREATE TABLE public.team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  invited_by uuid NOT NULL,
  token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email, status)
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invites"
  ON public.team_invites FOR ALL TO authenticated
  USING (has_org_role(auth.uid(), organization_id, ARRAY['owner'::org_role, 'admin'::org_role]))
  WITH CHECK (has_org_role(auth.uid(), organization_id, ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Members can view invites"
  ON public.team_invites FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE TRIGGER update_team_invites_updated_at
  BEFORE UPDATE ON public.team_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
