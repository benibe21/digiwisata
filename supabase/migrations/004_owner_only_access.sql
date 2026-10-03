-- SITUPARK access model:
-- authenticated users can monitor data; only PENANGGUNG_JAWAB can mutate it.
CREATE OR REPLACE FUNCTION public.is_penanggung_jawab()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'PENANGGUNG_JAWAB'
  );
$$;

DO $$
DECLARE
  table_name TEXT;
  policy_record RECORD;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'users', 'personnel', 'allocation_categories', 'allocation_configs',
    'closing_reports', 'closing_allocations', 'management_incentives',
    'fund_transactions', 'social_fund_transactions',
    'visitor_protection_transactions', 'audit_logs', 'closing_corrections',
    'personnel_schedules', 'personnel_schedule_assignments'
  ] LOOP
    FOR policy_record IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = table_name
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, table_name);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (auth.role() = ''authenticated'')',
      table_name || ' can be monitored by authenticated users', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (public.is_penanggung_jawab())',
      table_name || ' can be inserted by owner', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (public.is_penanggung_jawab()) WITH CHECK (public.is_penanggung_jawab())',
      table_name || ' can be updated by owner', table_name
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (public.is_penanggung_jawab())',
      table_name || ' can be deleted by owner', table_name
    );
  END LOOP;
END $$;