-- Fix mass deletes for databases that require an explicit WHERE clause.
CREATE OR REPLACE FUNCTION public.reset_app_data(reset_scope TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_penanggung_jawab() THEN
    RAISE EXCEPTION 'Hanya Penanggung Jawab yang dapat mereset data';
  END IF;

  IF reset_scope NOT IN ('closing', 'funds', 'personnel', 'schedule', 'allocation', 'audit', 'all') THEN
    RAISE EXCEPTION 'Scope reset tidak dikenal: %', reset_scope;
  END IF;

  IF reset_scope IN ('funds', 'all') THEN
    DELETE FROM public.fund_transfers WHERE TRUE;
    DELETE FROM public.fund_transactions WHERE TRUE;
    DELETE FROM public.social_fund_transactions WHERE TRUE;
    DELETE FROM public.visitor_protection_transactions WHERE TRUE;
  END IF;

  IF reset_scope IN ('closing', 'all') THEN
    DELETE FROM public.closing_corrections WHERE TRUE;
    DELETE FROM public.management_incentives WHERE TRUE;
    DELETE FROM public.closing_allocations WHERE TRUE;
    DELETE FROM public.closing_reports WHERE TRUE;
  END IF;

  IF reset_scope IN ('schedule', 'personnel', 'all') THEN
    DELETE FROM public.personnel_schedule_assignments WHERE TRUE;
    DELETE FROM public.personnel_schedules WHERE TRUE;
  END IF;

  IF reset_scope IN ('personnel', 'all') THEN
    DELETE FROM public.personnel WHERE TRUE;
  END IF;

  IF reset_scope IN ('allocation', 'all') THEN
    DELETE FROM public.allocation_configs WHERE TRUE;
  END IF;

  IF reset_scope IN ('audit', 'all') THEN
    DELETE FROM public.audit_logs WHERE TRUE;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_app_data(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_app_data(TEXT) TO authenticated;
