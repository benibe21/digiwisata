CREATE TABLE IF NOT EXISTS public.personnel_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  required_count INTEGER NOT NULL DEFAULT 1 CHECK (required_count > 0 AND required_count <= 100),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.personnel_schedule_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID NOT NULL REFERENCES public.personnel_schedules(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(schedule_id, personnel_id)
);

ALTER TABLE public.personnel_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_schedule_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read schedules" ON public.personnel_schedules;
DROP POLICY IF EXISTS "Authenticated users can manage schedules" ON public.personnel_schedules;
DROP POLICY IF EXISTS "Authenticated users can read assignments" ON public.personnel_schedule_assignments;
DROP POLICY IF EXISTS "Authenticated users can manage assignments" ON public.personnel_schedule_assignments;

CREATE POLICY "Authenticated users can read schedules" ON public.personnel_schedules
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage schedules" ON public.personnel_schedules
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read assignments" ON public.personnel_schedule_assignments
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage assignments" ON public.personnel_schedule_assignments
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_personnel_schedules_day ON public.personnel_schedules(day_of_week, start_time);