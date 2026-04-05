CREATE TABLE public.show_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  show_id uuid NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('parking', 'hospitality', 'merch', 'settlement')),
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(show_id, section)
);

ALTER TABLE public.show_operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view operations" ON public.show_operations
  FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Admin/TM can insert operations" ON public.show_operations
  FOR INSERT TO authenticated WITH CHECK (has_org_role(auth.uid(), organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'tm'::org_role]));

CREATE POLICY "Admin/TM can update operations" ON public.show_operations
  FOR UPDATE TO authenticated USING (has_org_role(auth.uid(), organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'tm'::org_role]));

CREATE POLICY "Admin/TM can delete operations" ON public.show_operations
  FOR DELETE TO authenticated USING (has_org_role(auth.uid(), organization_id, ARRAY['owner'::org_role, 'admin'::org_role, 'tm'::org_role]));

CREATE TRIGGER update_show_operations_updated_at BEFORE UPDATE ON public.show_operations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Also add guest_list_max to shows table for TM/admin to set max guests
ALTER TABLE public.shows ADD COLUMN IF NOT EXISTS guest_list_max integer DEFAULT NULL;