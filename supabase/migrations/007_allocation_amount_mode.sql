ALTER TABLE public.allocation_configs
  ADD COLUMN IF NOT EXISTS allocation_type TEXT NOT NULL DEFAULT 'PERCENTAGE'
    CHECK (allocation_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
  ADD COLUMN IF NOT EXISTS fixed_amount NUMERIC(15, 2) NOT NULL DEFAULT 0
    CHECK (fixed_amount >= 0);