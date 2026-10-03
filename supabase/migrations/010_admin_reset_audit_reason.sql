-- Allow the admin to reset selected data scopes and preserve an audit record with the reason.
CREATE OR REPLACE FUNCTION public.reset_app_data(reset_scopes TEXT[], reset_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_scope TEXT;
BEGIN
  IF NOT public.is_penanggung_jawab() THEN
    RAISE EXCEPTION 'Hanya Penanggung Jawab yang dapat mereset data';
  END IF;

  IF reset_scopes IS NULL OR COALESCE(array_length(reset_scopes, 1), 0) = 0 THEN
    RAISE EXCEPTION 'Pilih minimal satu bagian data untuk direset';
  END IF;

  IF reset_reason IS NULL OR length(trim(reset_reason)) < 3 THEN
    RAISE EXCEPTION 'Alasan reset wajib diisi';
  END IF;

  FOREACH selected_scope IN ARRAY reset_scopes LOOP
    IF selected_scope NOT IN ('closing', 'funds', 'personnel', 'schedule', 'allocation', 'audit', 'all') THEN
      RAISE EXCEPTION 'Scope reset tidak dikenal: %', selected_scope;
    END IF;
  END LOOP;

  IF 'all' = ANY(reset_scopes) OR 'funds' = ANY(reset_scopes) THEN
    DELETE FROM public.fund_transfers WHERE TRUE;
    DELETE FROM public.fund_transactions WHERE TRUE;
    DELETE FROM public.social_fund_transactions WHERE TRUE;
    DELETE FROM public.visitor_protection_transactions WHERE TRUE;
  END IF;

  IF 'all' = ANY(reset_scopes) OR 'closing' = ANY(reset_scopes) THEN
    DELETE FROM public.closing_corrections WHERE TRUE;
    DELETE FROM public.management_incentives WHERE TRUE;
    DELETE FROM public.closing_allocations WHERE TRUE;
    DELETE FROM public.closing_reports WHERE TRUE;
  END IF;

  IF 'all' = ANY(reset_scopes) OR 'schedule' = ANY(reset_scopes) OR 'personnel' = ANY(reset_scopes) THEN
    DELETE FROM public.personnel_schedule_assignments WHERE TRUE;
    DELETE FROM public.personnel_schedules WHERE TRUE;
  END IF;

  IF 'all' = ANY(reset_scopes) OR 'personnel' = ANY(reset_scopes) THEN
    DELETE FROM public.personnel WHERE TRUE;
  END IF;

  IF 'all' = ANY(reset_scopes) OR 'allocation' = ANY(reset_scopes) THEN
    DELETE FROM public.allocation_configs WHERE TRUE;
  END IF;

  IF 'all' = ANY(reset_scopes) OR 'audit' = ANY(reset_scopes) THEN
    DELETE FROM public.audit_logs WHERE TRUE;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, entity_type, old_value, new_value, reason)
  VALUES (
    auth.uid(),
    'RESET_DATA',
    'RESET_SCOPE',
    NULL,
    jsonb_build_object('scopes', reset_scopes),
    trim(reset_reason)
  );
END;
$$;

DROP FUNCTION IF EXISTS public.reset_app_data(TEXT);
REVOKE ALL ON FUNCTION public.reset_app_data(TEXT[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reset_app_data(TEXT[], TEXT) TO authenticated;
