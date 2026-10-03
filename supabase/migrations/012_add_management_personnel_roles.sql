ALTER TABLE public.personnel
  DROP CONSTRAINT IF EXISTS personnel_role_check;

ALTER TABLE public.personnel
  ADD CONSTRAINT personnel_role_check
  CHECK (role IN ('JURU_PARKIR', 'KEAMANAN', 'KEBERSIHAN', 'LAINNYA', 'PENANGGUNG_JAWAB', 'KOORDINATOR'));