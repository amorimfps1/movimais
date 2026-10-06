-- Salva uma chamada completa e conclui a aula na mesma transação.
-- Cópias idênticas são arquivadas antes de criar os índices. Se houver
-- divergência em dados da mesma chamada ou aula, a migração é cancelada.
BEGIN;

-- Impede novas gravações durante a consolidação e a criação dos índices.
LOCK TABLE public.presencas, public.aulas IN ACCESS EXCLUSIVE MODE;

ALTER TABLE public.presencas
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS public.presencas_duplicadas_arquivo AS
SELECT p.*, now()::timestamptz AS arquivado_em
FROM public.presencas AS p WHERE false;
ALTER TABLE public.presencas_duplicadas_arquivo
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS presencas_duplicadas_arquivo_id
  ON public.presencas_duplicadas_arquivo(id);
ALTER TABLE public.presencas_duplicadas_arquivo ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.presencas_duplicadas_arquivo FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.aulas_duplicadas_arquivo AS
SELECT a.*, now()::timestamptz AS arquivado_em
FROM public.aulas AS a WHERE false;
CREATE UNIQUE INDEX IF NOT EXISTS aulas_duplicadas_arquivo_id
  ON public.aulas_duplicadas_arquivo(id);
ALTER TABLE public.aulas_duplicadas_arquivo ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.aulas_duplicadas_arquivo FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.presencas
    WHERE id_turma IS NOT NULL AND id_matricula IS NOT NULL AND deleted_at IS NULL
    GROUP BY id_turma, data_aula, id_matricula
    HAVING count(DISTINCT jsonb_build_array(id_aluno, presenca, tipo_registro)) > 1
  ) THEN
    RAISE EXCEPTION 'Há presenças duplicadas com informações divergentes. Inspecione antes de criar o índice único.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.aulas
    WHERE id_turma IS NOT NULL
    GROUP BY id_turma, data_aula
    HAVING count(DISTINCT jsonb_build_array(id_instrutor, horario_inicio, horario_fim, status_aula, observacoes)) > 1
  ) THEN
    RAISE EXCEPTION 'Há aulas duplicadas com informações divergentes. Inspecione antes de criar o índice único.';
  END IF;
END;
$$;

WITH duplicatas AS (
  SELECT id, row_number() OVER (
    PARTITION BY id_turma, data_aula, id_matricula
    ORDER BY created_at DESC NULLS LAST, id DESC
  ) AS posicao
  FROM public.presencas
  WHERE id_turma IS NOT NULL AND id_matricula IS NOT NULL AND deleted_at IS NULL
)
INSERT INTO public.presencas_duplicadas_arquivo
  (id, data_aula, id_turma, id_matricula, id_aluno,
   presenca, tipo_registro, created_at, deleted_at, arquivado_em)
SELECT p.id, p.data_aula, p.id_turma, p.id_matricula, p.id_aluno,
       p.presenca, p.tipo_registro, p.created_at, p.deleted_at, now()
FROM public.presencas AS p
JOIN duplicatas AS d ON d.id = p.id
WHERE d.posicao > 1
ON CONFLICT (id) DO NOTHING;

WITH duplicatas AS (
  SELECT id, row_number() OVER (
    PARTITION BY id_turma, data_aula, id_matricula
    ORDER BY created_at DESC NULLS LAST, id DESC
  ) AS posicao
  FROM public.presencas
  WHERE id_turma IS NOT NULL AND id_matricula IS NOT NULL AND deleted_at IS NULL
)
UPDATE public.presencas AS p
SET deleted_at = now()
FROM duplicatas AS d
WHERE p.id = d.id AND d.posicao > 1;

WITH duplicatas AS (
  SELECT id, row_number() OVER (
    PARTITION BY id_turma, data_aula
    ORDER BY created_at DESC NULLS LAST, id DESC
  ) AS posicao
  FROM public.aulas
  WHERE id_turma IS NOT NULL
)
INSERT INTO public.aulas_duplicadas_arquivo
SELECT a.*, now()
FROM public.aulas AS a
JOIN duplicatas AS d ON d.id = a.id
WHERE d.posicao > 1
ON CONFLICT (id) DO NOTHING;

WITH duplicatas AS (
  SELECT id, row_number() OVER (
    PARTITION BY id_turma, data_aula
    ORDER BY created_at DESC NULLS LAST, id DESC
  ) AS posicao
  FROM public.aulas
  WHERE id_turma IS NOT NULL
)
DELETE FROM public.aulas AS a
USING duplicatas AS d
WHERE a.id = d.id AND d.posicao > 1;

CREATE UNIQUE INDEX IF NOT EXISTS presencas_uma_por_matricula_aula
  ON public.presencas (id_turma, data_aula, id_matricula)
  WHERE id_turma IS NOT NULL AND id_matricula IS NOT NULL AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS aulas_uma_por_turma_data
  ON public.aulas (id_turma, data_aula)
  WHERE id_turma IS NOT NULL;

CREATE OR REPLACE FUNCTION public.salvar_chamada(
  _turma_id text,
  _data_aula date,
  _registros jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_turma public.turmas%ROWTYPE;
  v_total integer;
  v_distintos integer;
  v_elegiveis integer;
BEGIN
  IF auth.uid() IS NULL OR _turma_id IS NULL OR _data_aula IS NULL THEN
    RAISE EXCEPTION 'Turma, data e usuário autenticado são obrigatórios.';
  END IF;

  SELECT * INTO v_turma
  FROM public.turmas
  WHERE id = _turma_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Turma não encontrada.';
  END IF;

  IF NOT public.is_admin(auth.uid())
     AND NOT (
       public.instructor_owns_turma(_turma_id)
       OR EXISTS (
         SELECT 1 FROM public.aulas AS a
         JOIN public.instrutores AS i ON i.id = a.id_instrutor
         WHERE a.id_turma = _turma_id
           AND a.data_aula = _data_aula
           AND i.user_id = auth.uid()
           AND public.has_role(auth.uid(), 'instrutor')
       )
     ) THEN
    RAISE EXCEPTION 'Sem permissão para registrar a chamada desta aula.';
  END IF;

  IF _registros IS NULL OR jsonb_typeof(_registros) <> 'array' THEN
    RAISE EXCEPTION 'A chamada deve ser uma lista de matrículas e presenças.';
  END IF;

  SELECT count(*), count(DISTINCT id_matricula)
  INTO v_total, v_distintos
  FROM jsonb_to_recordset(_registros) AS r(id_matricula text, presenca boolean);

  IF v_total = 0 OR v_total <> v_distintos OR EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(_registros) AS r(id_matricula text, presenca boolean)
    WHERE r.id_matricula IS NULL OR r.presenca IS NULL
  ) THEN
    RAISE EXCEPTION 'Marque a presença de cada matrícula uma única vez.';
  END IF;

  SELECT count(*) INTO v_elegiveis
  FROM public.matriculas AS m
  WHERE m.id_turma = _turma_id
    AND (
      (m.status_matricula = 'ATIVA' AND m.liberado_para_aula IS TRUE)
      OR (m.status_matricula = 'EXPERIMENTAL' AND v_turma.permite_experimental IS TRUE)
    );

  IF v_total <> v_elegiveis OR EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(_registros) AS r(id_matricula text, presenca boolean)
    LEFT JOIN public.matriculas AS m ON m.id = r.id_matricula
    WHERE m.id IS NULL OR m.id_turma IS DISTINCT FROM _turma_id
      OR NOT (
        (m.status_matricula = 'ATIVA' AND m.liberado_para_aula IS TRUE)
        OR (m.status_matricula = 'EXPERIMENTAL' AND v_turma.permite_experimental IS TRUE)
      )
  ) THEN
    RAISE EXCEPTION 'A lista de chamada mudou. Reabra a turma antes de salvar.';
  END IF;

  INSERT INTO public.presencas (
    id, data_aula, id_turma, id_matricula, id_aluno, presenca, tipo_registro
  )
  SELECT gen_random_uuid()::text, _data_aula, _turma_id,
         m.id, m.id_aluno, r.presenca, 'MANUAL'
  FROM jsonb_to_recordset(_registros) AS r(id_matricula text, presenca boolean)
  JOIN public.matriculas AS m ON m.id = r.id_matricula
  ON CONFLICT (id_turma, data_aula, id_matricula)
    WHERE id_turma IS NOT NULL AND id_matricula IS NOT NULL AND deleted_at IS NULL
  DO UPDATE SET presenca = EXCLUDED.presenca;

  INSERT INTO public.aulas (
    id, id_turma, id_instrutor, data_aula, horario_inicio,
    horario_fim, status_aula
  ) VALUES (
    gen_random_uuid()::text, _turma_id, v_turma.id_instrutor,
    _data_aula, v_turma.horario_inicio, v_turma.horario_fim, 'REALIZADA'
  )
  ON CONFLICT (id_turma, data_aula) WHERE id_turma IS NOT NULL
  DO UPDATE SET status_aula = 'REALIZADA';
END;
$$;

REVOKE ALL ON FUNCTION public.salvar_chamada(text, date, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.salvar_chamada(text, date, jsonb) TO authenticated;

COMMIT;
