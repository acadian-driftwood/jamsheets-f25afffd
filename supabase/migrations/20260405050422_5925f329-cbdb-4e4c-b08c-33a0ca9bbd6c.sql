
CREATE OR REPLACE FUNCTION public.check_workspace_limit(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT CASE (
    SELECT COALESCE(MAX(
      CASE s.plan_tier
        WHEN 'manager' THEN 3
        WHEN 'band' THEN 2
        WHEN 'free' THEN 1
        ELSE 1
      END
    ), 1)
    FROM public.organization_members om
    JOIN public.subscriptions s ON s.organization_id = om.organization_id AND s.status IN ('active', 'trialing')
    WHERE om.user_id = _user_id AND om.role = 'owner'
  )
    WHEN 3 THEN (SELECT count(*) FROM public.organization_members WHERE user_id = _user_id AND role = 'owner') < 10
    ELSE (SELECT count(*) FROM public.organization_members WHERE user_id = _user_id AND role = 'owner') < 1
  END;
$$;
