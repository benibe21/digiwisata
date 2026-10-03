-- Daily attendance is separate from the weekly roster so historical closings remain stable.
CREATE TABLE IF NOT EXISTS public.personnel_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attendance_date DATE NOT NULL,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PRESENT', 'EXCUSED', 'ABSENT')),
  check_in_at TIMESTAMP WITH TIME ZONE,
  marked_by UUID REFERENCES public.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(attendance_date, personnel_id)
);

ALTER TABLE public.personnel_schedule_assignments
  ADD COLUMN IF NOT EXISTS position TEXT NOT NULL DEFAULT 'BACK'
  CHECK (position IN ('FRONT', 'BACK'));

ALTER TABLE public.personnel_schedule_assignments
  ADD COLUMN IF NOT EXISTS is_cash_handler BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.personnel_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Attendance can be monitored by authenticated users" ON public.personnel_attendance;
DROP POLICY IF EXISTS "Attendance can be inserted by owner or coordinator" ON public.personnel_attendance;
DROP POLICY IF EXISTS "Attendance can be updated by owner or coordinator" ON public.personnel_attendance;

CREATE POLICY "Attendance can be monitored by authenticated users" ON public.personnel_attendance
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Attendance can be inserted by owner or coordinator" ON public.personnel_attendance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR'))
  );
CREATE POLICY "Attendance can be updated by owner or coordinator" ON public.personnel_attendance
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR'))
  );

CREATE INDEX IF NOT EXISTS idx_personnel_attendance_date ON public.personnel_attendance(attendance_date, status);

-- DigiWisata phase 1: field reports submitted by PETUGAS and reviewed by administrators.
CREATE TABLE IF NOT EXISTS public.tourism_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number TEXT NOT NULL UNIQUE,
  officer_id UUID NOT NULL REFERENCES public.users(id),
  tourism_site TEXT NOT NULL,
  tourism_type TEXT NOT NULL,
  visit_date DATE NOT NULL,
  local_visitors INTEGER NOT NULL DEFAULT 0 CHECK (local_visitors >= 0),
  foreign_visitors INTEGER NOT NULL DEFAULT 0 CHECK (foreign_visitors >= 0),
  total_visitors INTEGER GENERATED ALWAYS AS (local_visitors + foreign_visitors) STORED,
  evidence_path TEXT,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  district TEXT,
  location_captured_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'VERIFIED', 'REJECTED')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tourism_reports_visit_date ON public.tourism_reports(visit_date);
CREATE INDEX IF NOT EXISTS idx_tourism_reports_status ON public.tourism_reports(status);
ALTER TABLE public.tourism_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Officers can read their tourism reports" ON public.tourism_reports;
DROP POLICY IF EXISTS "Administrators can read tourism reports" ON public.tourism_reports;
DROP POLICY IF EXISTS "Officers can submit tourism reports" ON public.tourism_reports;
DROP POLICY IF EXISTS "Administrators can review tourism reports" ON public.tourism_reports;
CREATE POLICY "Officers can read their tourism reports" ON public.tourism_reports FOR SELECT USING (auth.uid() = officer_id);
CREATE POLICY "Administrators can read tourism reports" ON public.tourism_reports FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR')));
CREATE POLICY "Officers can submit tourism reports" ON public.tourism_reports FOR INSERT WITH CHECK (auth.uid() = officer_id AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'PETUGAS'));
CREATE POLICY "Administrators can review tourism reports" ON public.tourism_reports FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR')));

-- Keep deployed databases compatible and let officers resubmit only their rejected reports.
ALTER TABLE public.tourism_reports ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.tourism_reports ADD COLUMN IF NOT EXISTS location_captured_at TIMESTAMP WITH TIME ZONE;
DROP POLICY IF EXISTS "Officers can resubmit rejected tourism reports" ON public.tourism_reports;
CREATE POLICY "Officers can resubmit rejected tourism reports" ON public.tourism_reports
  FOR UPDATE
  USING (
    auth.uid() = officer_id
    AND status = 'REJECTED'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'PETUGAS')
  )
  WITH CHECK (
    auth.uid() = officer_id
    AND status = 'SUBMITTED'
    AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'PETUGAS')
  );

INSERT INTO storage.buckets (id, name, public)
VALUES ('tourism-evidence', 'tourism-evidence', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload tourism evidence" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read tourism evidence" ON storage.objects;
CREATE POLICY "Authenticated users can upload tourism evidence" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'tourism-evidence' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can read tourism evidence" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'tourism-evidence');

-- DigiWisata now has only PETUGAS and ADMIN application roles.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
-- Preserve existing administrator accounts; only migrate their role names.
UPDATE public.users
SET role = 'ADMIN'
WHERE role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR');
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check CHECK (role IN ('ADMIN', 'PETUGAS'));

CREATE OR REPLACE FUNCTION public.is_penanggung_jawab()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN');
$$;

DROP POLICY IF EXISTS "Administrators can read tourism reports" ON public.tourism_reports;
CREATE POLICY "Administrators can read tourism reports" ON public.tourism_reports
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));
DROP POLICY IF EXISTS "Administrators can review tourism reports" ON public.tourism_reports;
CREATE POLICY "Administrators can review tourism reports" ON public.tourism_reports
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));
DROP POLICY IF EXISTS "Audit logs can read" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs can be monitored by authenticated users" ON public.audit_logs;
CREATE POLICY "Audit logs can read" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'));

NOTIFY pgrst, 'reload schema';