ALTER TABLE public.fund_transactions
  ADD COLUMN IF NOT EXISTS allocation_category_id UUID REFERENCES public.allocation_categories(id);

CREATE INDEX IF NOT EXISTS idx_fund_transactions_category
  ON public.fund_transactions(allocation_category_id);