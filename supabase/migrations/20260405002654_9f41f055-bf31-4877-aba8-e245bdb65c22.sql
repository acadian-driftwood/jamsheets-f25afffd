
-- Create role enum
CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'tm', 'member', 'crew', 'readonly');

-- Create timeline item type enum
CREATE TYPE public.timeline_item_type AS ENUM ('off_day', 'flight', 'rental_pickup', 'rental_dropoff');

-- Create guest status enum
CREATE TYPE public.guest_status AS ENUM ('pending', 'confirmed', 'declined');

-- Create tour status enum
CREATE TYPE public.tour_status AS ENUM ('draft', 'active', 'completed', 'archived');

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ORGANIZATIONS
-- ============================================================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ORGANIZATION MEMBERS
-- ============================================================
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Security definer function: check org membership (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

-- Check if user has a specific role or higher
CREATE OR REPLACE FUNCTION public.has_org_role(_user_id UUID, _org_id UUID, _roles org_role[])
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id AND role = ANY(_roles)
  )
$$;

-- RLS for organizations: members can see their orgs
CREATE POLICY "Members can view their organizations" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), id));
CREATE POLICY "Authenticated users can create organizations" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins can update organizations" ON public.organizations
  FOR UPDATE TO authenticated USING (public.has_org_role(auth.uid(), id, ARRAY['owner', 'admin']::org_role[]));

-- RLS for organization_members
CREATE POLICY "Members can view org members" ON public.organization_members
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admins can insert members" ON public.organization_members
  FOR INSERT TO authenticated WITH CHECK (
    public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::org_role[])
    OR NOT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = organization_members.organization_id)
  );
CREATE POLICY "Admins can update members" ON public.organization_members
  FOR UPDATE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::org_role[]));
CREATE POLICY "Admins can delete members" ON public.organization_members
  FOR DELETE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin']::org_role[]));

-- ============================================================
-- TOURS
-- ============================================================
CREATE TABLE public.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  status tour_status NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_tours_updated_at BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can view tours" ON public.tours
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admin/TM can create tours" ON public.tours
  FOR INSERT TO authenticated WITH CHECK (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can update tours" ON public.tours
  FOR UPDATE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can delete tours" ON public.tours
  FOR DELETE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));

-- ============================================================
-- SHOWS
-- ============================================================
CREATE TABLE public.shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tour_id UUID REFERENCES public.tours(id) ON DELETE SET NULL,
  venue TEXT NOT NULL,
  city TEXT,
  address TEXT,
  date DATE NOT NULL,
  capacity INTEGER,
  notes TEXT,
  gear_notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON public.shows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can view shows" ON public.shows
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admin/TM can create shows" ON public.shows
  FOR INSERT TO authenticated WITH CHECK (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can update shows" ON public.shows
  FOR UPDATE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can delete shows" ON public.shows
  FOR DELETE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));

-- ============================================================
-- SHOW HOTELS
-- ============================================================
CREATE TABLE public.show_hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  hotel_name TEXT NOT NULL,
  address TEXT,
  confirmation_number TEXT,
  check_in TEXT,
  check_out TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.show_hotels ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_show_hotels_updated_at BEFORE UPDATE ON public.show_hotels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can view hotels" ON public.show_hotels
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admin/TM can manage hotels" ON public.show_hotels
  FOR INSERT TO authenticated WITH CHECK (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can update hotels" ON public.show_hotels
  FOR UPDATE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can delete hotels" ON public.show_hotels
  FOR DELETE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));

-- ============================================================
-- SHOW CONTACTS
-- ============================================================
CREATE TABLE public.show_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.show_contacts ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_show_contacts_updated_at BEFORE UPDATE ON public.show_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can view contacts" ON public.show_contacts
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admin/TM can manage contacts" ON public.show_contacts
  FOR INSERT TO authenticated WITH CHECK (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can update contacts" ON public.show_contacts
  FOR UPDATE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can delete contacts" ON public.show_contacts
  FOR DELETE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));

-- ============================================================
-- SHOW SCHEDULE ITEMS
-- ============================================================
CREATE TABLE public.show_schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.show_schedule_items ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_show_schedule_items_updated_at BEFORE UPDATE ON public.show_schedule_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can view schedule" ON public.show_schedule_items
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admin/TM can manage schedule" ON public.show_schedule_items
  FOR INSERT TO authenticated WITH CHECK (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can update schedule" ON public.show_schedule_items
  FOR UPDATE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can delete schedule" ON public.show_schedule_items
  FOR DELETE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));

-- ============================================================
-- SHOW GUEST LIST
-- ============================================================
CREATE TABLE public.show_guest_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_count INTEGER NOT NULL DEFAULT 1,
  status guest_status NOT NULL DEFAULT 'pending',
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.show_guest_list_entries ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_show_guest_list_updated_at BEFORE UPDATE ON public.show_guest_list_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can view guest list" ON public.show_guest_list_entries
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Members can request guests" ON public.show_guest_list_entries
  FOR INSERT TO authenticated WITH CHECK (
    public.is_org_member(auth.uid(), organization_id)
    AND auth.uid() = requested_by
  );
CREATE POLICY "Admin/TM can update guest status" ON public.show_guest_list_entries
  FOR UPDATE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can delete guest entries" ON public.show_guest_list_entries
  FOR DELETE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));

-- ============================================================
-- SHOW DOCUMENTS
-- ============================================================
CREATE TABLE public.show_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.show_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view documents" ON public.show_documents
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admin/TM can upload documents" ON public.show_documents
  FOR INSERT TO authenticated WITH CHECK (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can delete documents" ON public.show_documents
  FOR DELETE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));

-- ============================================================
-- TOUR TIMELINE ITEMS
-- ============================================================
CREATE TABLE public.tour_timeline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  type timeline_item_type NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  date DATE NOT NULL,
  time_start TEXT,
  time_end TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tour_timeline_items ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_tour_timeline_items_updated_at BEFORE UPDATE ON public.tour_timeline_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Members can view timeline" ON public.tour_timeline_items
  FOR SELECT TO authenticated USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Admin/TM can manage timeline" ON public.tour_timeline_items
  FOR INSERT TO authenticated WITH CHECK (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can update timeline" ON public.tour_timeline_items
  FOR UPDATE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));
CREATE POLICY "Admin/TM can delete timeline" ON public.tour_timeline_items
  FOR DELETE TO authenticated USING (public.has_org_role(auth.uid(), organization_id, ARRAY['owner', 'admin', 'tm']::org_role[]));

-- ============================================================
-- PRIVATE DOCUMENT STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('show-documents', 'show-documents', false);

CREATE POLICY "Org members can view docs" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'show-documents'
    AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
  );

CREATE POLICY "Admin/TM can upload docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'show-documents'
    AND public.has_org_role(auth.uid(), (storage.foldername(name))[1]::uuid, ARRAY['owner', 'admin', 'tm']::org_role[])
  );

CREATE POLICY "Admin/TM can delete docs" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'show-documents'
    AND public.has_org_role(auth.uid(), (storage.foldername(name))[1]::uuid, ARRAY['owner', 'admin', 'tm']::org_role[])
  );

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX idx_tours_org ON public.tours(organization_id);
CREATE INDEX idx_shows_org ON public.shows(organization_id);
CREATE INDEX idx_shows_tour ON public.shows(tour_id);
CREATE INDEX idx_shows_date ON public.shows(date);
CREATE INDEX idx_show_hotels_show ON public.show_hotels(show_id);
CREATE INDEX idx_show_contacts_show ON public.show_contacts(show_id);
CREATE INDEX idx_show_schedule_show ON public.show_schedule_items(show_id);
CREATE INDEX idx_show_guests_show ON public.show_guest_list_entries(show_id);
CREATE INDEX idx_show_docs_show ON public.show_documents(show_id);
CREATE INDEX idx_timeline_tour ON public.tour_timeline_items(tour_id);
CREATE INDEX idx_timeline_date ON public.tour_timeline_items(date);
