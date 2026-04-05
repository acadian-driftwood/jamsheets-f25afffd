
-- Plan tier enum
CREATE TYPE public.plan_tier AS ENUM ('free', 'band', 'manager');

-- Subscription status enum
CREATE TYPE public.subscription_status AS ENUM ('active', 'trialing', 'past_due', 'canceled', 'incomplete');

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_tier public.plan_tier NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  trial_ends_at timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Members can view their org's subscription
CREATE POLICY "Members can view subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

-- Owner/admin can update subscription
CREATE POLICY "Admins can update subscription"
  ON public.subscriptions FOR UPDATE
  TO authenticated
  USING (has_org_role(auth.uid(), organization_id, ARRAY['owner'::org_role, 'admin'::org_role]));

-- Service role or owner can insert (for auto-creation)
CREATE POLICY "System can insert subscription"
  ON public.subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (has_org_role(auth.uid(), organization_id, ARRAY['owner'::org_role, 'admin'::org_role]));

CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Helper: get plan tier for an org
CREATE OR REPLACE FUNCTION public.get_org_plan(_org_id uuid)
RETURNS public.plan_tier
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan_tier FROM public.subscriptions WHERE organization_id = _org_id AND status IN ('active', 'trialing') LIMIT 1),
    'free'::plan_tier
  );
$$;

-- Helper: check member limit
CREATE OR REPLACE FUNCTION public.check_member_limit(_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE get_org_plan(_org_id)
    WHEN 'free' THEN (SELECT count(*) FROM public.organization_members WHERE organization_id = _org_id) < 3
    WHEN 'band' THEN (SELECT count(*) FROM public.organization_members WHERE organization_id = _org_id) < 10
    WHEN 'manager' THEN (SELECT count(*) FROM public.organization_members WHERE organization_id = _org_id) < 25
    ELSE false
  END;
$$;

-- Helper: check active tour limit
CREATE OR REPLACE FUNCTION public.check_active_tour_limit(_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE get_org_plan(_org_id)
    WHEN 'free' THEN (SELECT count(*) FROM public.tours WHERE organization_id = _org_id AND status IN ('active', 'draft')) < 1
    ELSE true
  END;
$$;

-- Auto-create free subscription for new orgs
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.subscriptions (organization_id, plan_tier, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- Backfill existing orgs
INSERT INTO public.subscriptions (organization_id, plan_tier, status)
SELECT id, 'free', 'active' FROM public.organizations
WHERE id NOT IN (SELECT organization_id FROM public.subscriptions);
