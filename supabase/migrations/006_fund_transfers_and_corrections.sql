CREATE TABLE IF NOT EXISTS public.fund_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_category_id UUID NOT NULL REFERENCES public.allocation_categories(id),
  to_category_id UUID NOT NULL REFERENCES public.allocation_categories(id),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  agreement_note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CHECK (from_category_id <> to_category_id)
);

CREATE INDEX IF NOT EXISTS idx_fund_transfers_created_at ON public.fund_transfers(created_at);
ALTER TABLE public.fund_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read fund transfers" ON public.fund_transfers;
DROP POLICY IF EXISTS "Owner can manage fund transfers" ON public.fund_transfers;
CREATE POLICY "Authenticated users can read fund transfers" ON public.fund_transfers
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Owner can manage fund transfers" ON public.fund_transfers
  FOR ALL USING (public.is_penanggung_jawab()) WITH CHECK (public.is_penanggung_jawab());

CREATE OR REPLACE FUNCTION public.record_audit_log()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, old_value, new_value, reason)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), to_jsonb(OLD), to_jsonb(NEW), NULL);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS audit_fund_transfers ON public.fund_transfers;
CREATE TRIGGER audit_fund_transfers AFTER INSERT OR UPDATE OR DELETE ON public.fund_transfers
  FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_closing_reports ON public.closing_reports;
CREATE TRIGGER audit_closing_reports AFTER INSERT OR UPDATE OR DELETE ON public.closing_reports
  FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();

DROP TRIGGER IF EXISTS audit_closing_corrections ON public.closing_corrections;
CREATE TRIGGER audit_closing_corrections AFTER INSERT OR UPDATE OR DELETE ON public.closing_corrections
  FOR EACH ROW EXECUTE FUNCTION public.record_audit_log();