-- Add the categories that exist in the original single-file PWA.
-- Safe to run after 001_initial_schema.sql on an existing project.
INSERT INTO public.allocation_categories (name, description, examples, status, is_active)
VALUES
  ('Dana Partisipasi Masyarakat', 'Dana untuk masyarakat sekitar yang membantu kegiatan wisata ketika kondisi ramai.', ARRAY['Bantuan kegiatan ramai', 'Partisipasi warga'], 'SIMULASI', TRUE),
  ('Dana Kas Pengelola', 'Dana cadangan organisasi pengelola parkir untuk kebutuhan bersama.', ARRAY['Dana cadangan', 'Kebutuhan organisasi'], 'SIMULASI', TRUE),
  ('Insentif Manajemen', 'Dana penghargaan untuk pengelolaan dan koordinasi operasional parkir.', ARRAY['Koordinasi', 'Penghargaan pengelola'], 'SIMULASI', TRUE)
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  examples = EXCLUDED.examples,
  is_active = TRUE;

-- Seed percentages only when the admin profile already exists.
INSERT INTO public.allocation_configs (category_id, percentage, effective_date, created_by)
SELECT c.id,
  CASE c.name
    WHEN 'Dana Partisipasi Masyarakat' THEN 5
    WHEN 'Dana Kas Pengelola' THEN 5
    WHEN 'Insentif Manajemen' THEN 5
  END,
  CURRENT_DATE,
  u.id
FROM public.allocation_categories c
JOIN public.users u ON u.role = 'PENANGGUNG_JAWAB'
WHERE c.name IN ('Dana Partisipasi Masyarakat', 'Dana Kas Pengelola', 'Insentif Manajemen')
  AND NOT EXISTS (
    SELECT 1 FROM public.allocation_configs ac
    WHERE ac.category_id = c.id AND ac.effective_date = CURRENT_DATE
  );