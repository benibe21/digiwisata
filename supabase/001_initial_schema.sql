-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR', 'PETUGAS')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Personnel table
CREATE TABLE public.personnel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('JURU_PARKIR', 'KEAMANAN', 'KEBERSIHAN', 'LAINNYA')),
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  is_additional BOOLEAN DEFAULT FALSE,
  join_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Allocation Categories
CREATE TABLE public.allocation_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  examples TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'SIMULASI' CHECK (status IN ('SIMULASI', 'BELUM_DISETUJUI', 'DISETUJUI')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Allocation Configurations (versioned by effective_date)
CREATE TABLE public.allocation_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.allocation_categories(id) ON DELETE CASCADE,
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  effective_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(category_id, effective_date)
);

-- Closing Reports
CREATE TABLE public.closing_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  time TEXT NOT NULL,
  omzet NUMERIC(15, 2) NOT NULL CHECK (omzet >= 0),
  total_allocation NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total_allocation >= 0),
  remaining_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (remaining_amount >= 0),
  personnel_count INTEGER NOT NULL DEFAULT 0 CHECK (personnel_count >= 0),
  per_personnel_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (per_personnel_amount >= 0),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'CORRECTED')),
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Closing Allocations (detail per category)
CREATE TABLE public.closing_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  closing_report_id UUID NOT NULL REFERENCES public.closing_reports(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.allocation_categories(id),
  percentage NUMERIC(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(closing_report_id, category_id)
);

-- Management Incentives
CREATE TABLE public.management_incentives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  closing_report_id UUID NOT NULL REFERENCES public.closing_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  percentage NUMERIC(5, 2) CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(closing_report_id, user_id)
);

-- Fund Transactions (Kas Operasional, Dana Darurat, etc.)
CREATE TABLE public.fund_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fund_type TEXT NOT NULL CHECK (fund_type IN ('KAS_OPERASIONAL', 'DANA_DARURAT', 'DANA_KEBERSIHAN', 'DANA_PENGEMBANGAN')),
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  closing_report_id UUID REFERENCES public.closing_reports(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Social Fund Transactions
CREATE TABLE public.social_fund_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  recipient TEXT,
  description TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Visitor Protection Fund Transactions
CREATE TABLE public.visitor_protection_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('IN', 'OUT')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  case_description TEXT,
  status TEXT NOT NULL DEFAULT 'VERIFICATION' CHECK (status IN ('VERIFICATION', 'APPROVED', 'REJECTED')),
  approved_by UUID REFERENCES public.users(id),
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Audit Logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Closing Corrections
CREATE TABLE public.closing_corrections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  closing_report_id UUID NOT NULL REFERENCES public.closing_reports(id),
  old_omzet NUMERIC(15, 2) NOT NULL,
  new_omzet NUMERIC(15, 2) NOT NULL,
  reason TEXT NOT NULL,
  corrected_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_allocation_configs_effective_date ON public.allocation_configs(effective_date);
CREATE INDEX idx_closing_reports_date ON public.closing_reports(date);
CREATE INDEX idx_closing_reports_status ON public.closing_reports(status);
CREATE INDEX idx_closing_allocations_report_id ON public.closing_allocations(closing_report_id);
CREATE INDEX idx_fund_transactions_type ON public.fund_transactions(fund_type);
CREATE INDEX idx_fund_transactions_date ON public.fund_transactions(created_at);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_personnel_status ON public.personnel(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personnel_updated_at BEFORE UPDATE ON public.personnel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allocation_categories_updated_at BEFORE UPDATE ON public.allocation_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_allocation_configs_updated_at BEFORE UPDATE ON public.allocation_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_closing_reports_updated_at BEFORE UPDATE ON public.closing_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocation_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closing_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_protection_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closing_corrections ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - adjust based on your security requirements)

-- Users: Everyone can read, only authenticated can insert/update
CREATE POLICY "Users can read all users" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert users" ON public.users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update users" ON public.users
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Personnel: Everyone can read, only PENANGGUNG_JAWAB and KOORDINATOR can modify
CREATE POLICY "Personnel can read all" ON public.personnel
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Personnel can insert" ON public.personnel
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR')
    )
  );

CREATE POLICY "Personnel can update" ON public.personnel
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR')
    )
  );

-- Allocation Categories: Everyone can read, only PENANGGUNG_JAWAB can modify
CREATE POLICY "Categories can read all" ON public.allocation_categories
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Categories can insert" ON public.allocation_categories
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'PENANGGUNG_JAWAB'
    )
  );

CREATE POLICY "Categories can update" ON public.allocation_categories
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'PENANGGUNG_JAWAB'
    )
  );

-- Allocation Configs: Everyone can read, only PENANGGUNG_JAWAB can modify
CREATE POLICY "Configs can read all" ON public.allocation_configs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Configs can insert" ON public.allocation_configs
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'PENANGGUNG_JAWAB'
    )
  );

CREATE POLICY "Configs can update" ON public.allocation_configs
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'PENANGGUNG_JAWAB'
    )
  );

-- Closing Reports: Everyone can read, KOORDINATOR and PETUGAS can insert, PENANGGUNG_JAWAB can update status
CREATE POLICY "Closing can read all" ON public.closing_reports
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Closing can insert" ON public.closing_reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Closing can update" ON public.closing_reports
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR')
    )
  );

-- Closing Allocations: Same as closing reports
CREATE POLICY "Closing allocations can read all" ON public.closing_allocations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Closing allocations can insert" ON public.closing_allocations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Fund Transactions: Everyone can read, PENANGGUNG_JAWAB and KOORDINATOR can modify
CREATE POLICY "Fund transactions can read all" ON public.fund_transactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Fund transactions can insert" ON public.fund_transactions
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('PENANGGUNG_JAWAB', 'KOORDINATOR')
    )
  );

-- Audit Logs: Only PENANGGUNG_JAWAB can read, system writes
CREATE POLICY "Audit logs can read" ON public.audit_logs
  FOR SELECT USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'PENANGGUNG_JAWAB'
    )
  );

CREATE POLICY "Audit logs can insert" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert initial allocation categories
INSERT INTO public.allocation_categories (name, description, examples, status) VALUES
('Retribusi / Setoran Dishub', 'Untuk kewajiban/setoran kepada Dishub sesuai ketentuan kerja sama yang nantinya disepakati.', ARRAY['Setoran bulanan', 'Kontribusi operasional'], 'SIMULASI'),
('Dana Keamanan & Koordinasi', 'Untuk kebutuhan keamanan dan koordinasi lingkungan/instansi terkait sesuai keputusan pengelola.', ARRAY['Koordinasi dengan Babinsa', 'Koordinasi dengan Bhabinkamtibmas', 'Keamanan lingkungan'], 'SIMULASI'),
('Kas Operasional', 'Untuk kebutuhan operasional sehari-hari seperti tiket, alat tulis, perlengkapan parkir, komunikasi, dan kebutuhan administrasi.', ARRAY['Tiket parkir', 'Alat tulis kantor', 'Perlengkapan parkir', 'Pulsa komunikasi', 'Perbaikan perlengkapan'], 'SIMULASI'),
('Dana Darurat', 'Untuk kebutuhan mendesak dan kejadian tidak terduga yang berkaitan dengan operasional.', ARRAY['Perbaikan mendadak', 'Kondisi darurat'], 'SIMULASI'),
('Dana Perlindungan Pengunjung', 'Dana khusus untuk menangani kejadian tertentu seperti kehilangan kendaraan, helm, atau insiden lain yang berkaitan dengan pengelolaan parkir.', ARRAY['Penggantian helm hilang', 'Insiden kendaraan'], 'SIMULASI'),
('Dana Kebersihan Kawasan', 'Dana khusus untuk kebutuhan kebersihan kawasan.', ARRAY['Sampah', 'Kebersihan area parkir'], 'SIMULASI'),
('Dana Pengembangan Wisata', 'Untuk pengembangan dan peningkatan fasilitas kawasan wisata Danau Situterate.', ARRAY['Perbaikan fasilitas', 'Pengembangan area baru'], 'SIMULASI'),
('Dana Sosial Masyarakat Desa Situterate', 'Untuk membantu masyarakat Desa Situterate dalam kegiatan sosial/kemanusiaan.', ARRAY['Warga meninggal dunia', 'Musibah warga', 'Bantuan kemanusiaan'], 'SIMULASI'),
('Dana Kontribusi Kelembagaan Desa', 'Kontribusi kepada kelembagaan desa seperti Karang Taruna, BUMDes, dan kegiatan kelembagaan desa lainnya.', ARRAY['Karang Taruna', 'BUMDes', 'Kegiatan desa'], 'SIMULASI'),
('Dana Partisipasi Masyarakat', 'Dana untuk masyarakat sekitar yang membantu kegiatan wisata ketika kondisi ramai.', ARRAY['Bantuan kegiatan ramai', 'Partisipasi warga'], 'SIMULASI'),
('Dana Kas Pengelola', 'Dana cadangan organisasi pengelola parkir untuk kebutuhan bersama.', ARRAY['Dana cadangan', 'Kebutuhan organisasi'], 'SIMULASI'),
('Insentif Manajemen', 'Dana penghargaan untuk pengelolaan dan koordinasi operasional parkir.', ARRAY['Koordinasi', 'Penghargaan pengelola'], 'SIMULASI');

-- Insert initial allocation configuration (placeholder values)
INSERT INTO public.allocation_configs (category_id, percentage, effective_date, created_by)
SELECT 
  id, 
  CASE name
    WHEN 'Retribusi / Setoran Dishub' THEN 40
    WHEN 'Dana Keamanan & Koordinasi' THEN 5
    WHEN 'Kas Operasional' THEN 5
    WHEN 'Dana Darurat' THEN 5
    WHEN 'Dana Perlindungan Pengunjung' THEN 3
    WHEN 'Dana Kebersihan Kawasan' THEN 5
    WHEN 'Dana Pengembangan Wisata' THEN 5
    WHEN 'Dana Sosial Masyarakat Desa Situterate' THEN 5
    WHEN 'Dana Kontribusi Kelembagaan Desa' THEN 2
    WHEN 'Dana Partisipasi Masyarakat' THEN 5
    WHEN 'Dana Kas Pengelola' THEN 5
    WHEN 'Insentif Manajemen' THEN 5
    ELSE 0
  END,
  '2026-09-01',
  (SELECT id FROM public.users WHERE role = 'PENANGGUNG_JAWAB' LIMIT 1)
FROM public.allocation_categories
WHERE status = 'SIMULASI'
  AND EXISTS (
    SELECT 1
    FROM public.users
    WHERE role = 'PENANGGUNG_JAWAB'
  );
