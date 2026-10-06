-- Repara somente a duplicata confirmada pelo usuário.
-- Execute o arquivo inteiro no SQL Editor. Os dois registros são preservados:
-- CBF8223B permanece ativo; 802170C2 é arquivado e recebe deleted_at.
BEGIN;

LOCK TABLE public.presencas IN ACCESS EXCLUSIVE MODE;

ALTER TABLE public.presencas ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

DO $$
BEGIN
  IF (
    SELECT count(*) FROM public.presencas
    WHERE id_turma = 'TURMA_BAL_T2'
      AND data_aula = DATE '2026-06-22'
      AND id_matricula = 'A44E52E5'
      AND deleted_at IS NULL
  ) <> 2 OR (
    SELECT count(DISTINCT jsonb_build_array(id_aluno, presenca, tipo_registro))
    FROM public.presencas
    WHERE id_turma = 'TURMA_BAL_T2'
      AND data_aula = DATE '2026-06-22'
      AND id_matricula = 'A44E52E5'
      AND deleted_at IS NULL
  ) <> 1 OR NOT EXISTS (
    SELECT 1 FROM public.presencas WHERE id = 'CBF8223B'
  ) OR NOT EXISTS (
    SELECT 1 FROM public.presencas WHERE id = '802170C2'
  ) THEN
    RAISE EXCEPTION 'Os dois registros mudaram; nenhuma presença foi removida.';
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.presencas_duplicadas_arquivo AS
SELECT p.*, now()::timestamptz AS arquivado_em
FROM public.presencas AS p WHERE false;
ALTER TABLE public.presencas_duplicadas_arquivo
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.presencas_duplicadas_arquivo ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.presencas_duplicadas_arquivo FROM PUBLIC, anon, authenticated;

INSERT INTO public.presencas_duplicadas_arquivo
  (id, data_aula, id_turma, id_matricula, id_aluno,
   presenca, tipo_registro, created_at, deleted_at, arquivado_em)
SELECT p.id, p.data_aula, p.id_turma, p.id_matricula, p.id_aluno,
       p.presenca, p.tipo_registro, p.created_at, p.deleted_at, now()
FROM public.presencas AS p
WHERE p.id = '802170C2'
  AND p.id_turma = 'TURMA_BAL_T2'
  AND p.data_aula = DATE '2026-06-22'
  AND p.id_matricula = 'A44E52E5'
  AND NOT EXISTS (
    SELECT 1 FROM public.presencas_duplicadas_arquivo AS ar
    WHERE ar.id = p.id
  );

UPDATE public.presencas
SET deleted_at = now()
WHERE id = '802170C2'
  AND id_turma = 'TURMA_BAL_T2'
  AND data_aula = DATE '2026-06-22'
  AND id_matricula = 'A44E52E5';

DO $$
DECLARE
  v_restantes integer;
  v_arquivadas integer;
BEGIN
  SELECT count(*) INTO v_restantes FROM public.presencas
  WHERE id_turma = 'TURMA_BAL_T2'
    AND data_aula = DATE '2026-06-22'
    AND id_matricula = 'A44E52E5'
    AND deleted_at IS NULL;
  SELECT count(*) INTO v_arquivadas FROM public.presencas_duplicadas_arquivo
  WHERE id = '802170C2';
  IF v_restantes <> 1 OR v_arquivadas <> 1 THEN
    RAISE EXCEPTION 'Correção não concluída: presenças restantes=%, cópias arquivadas=%, usuário SQL=%',
      v_restantes, v_arquivadas, current_user;
  END IF;
END;
$$;

COMMIT;

SELECT
  (SELECT count(*) FROM public.presencas
   WHERE id_turma = 'TURMA_BAL_T2'
     AND data_aula = DATE '2026-06-22'
     AND id_matricula = 'A44E52E5'
     AND deleted_at IS NULL) AS presencas_restantes,
  (SELECT count(*) FROM public.presencas_duplicadas_arquivo
   WHERE id = '802170C2') AS copias_arquivadas;
