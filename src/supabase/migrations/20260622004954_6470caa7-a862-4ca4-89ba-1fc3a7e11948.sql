
ALTER TABLE public.historicos
  ADD COLUMN IF NOT EXISTS data_emprestimo timestamptz,
  ADD COLUMN IF NOT EXISTS data_prevista_devolucao timestamptz,
  ADD COLUMN IF NOT EXISTS data_devolucao timestamptz,
  ADD COLUMN IF NOT EXISTS valor_multa numeric(10,2) NOT NULL DEFAULT 0;

UPDATE public.historicos SET data_emprestimo = created_at WHERE data_emprestimo IS NULL;
