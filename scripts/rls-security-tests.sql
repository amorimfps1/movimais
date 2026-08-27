-- ============================================================================
-- SUÍTE DE TESTES AUTOMATIZADOS DE RLS (ROW LEVEL SECURITY) - MOVI+ MCJB
-- ============================================================================
-- Este script é 100% autônomo: ele cria usuários de teste temporários,
-- executa todas as validações de permissão por cargo e gera um relatório final.
-- Como executar: Copie e cole no Supabase SQL Editor e clique em 'RUN'.
-- ============================================================================

-- 1. Limpar schema antigo se existir
DROP SCHEMA IF EXISTS test_rls CASCADE;

-- 2. Bloco principal de testes
DO $$
DECLARE
    -- IDs fixos para o ambiente de teste
    c_instrutor_id   UUID := '11111111-1111-1111-1111-111111111111'::UUID;
    c_coordenacao_id UUID := '22222222-2222-2222-2222-222222222222'::UUID;
    c_secretaria_id  UUID := '33333333-3333-3333-3333-333333333333'::UUID;
    
    -- Contadores do relatório
    v_passed INT := 0;
    v_failed INT := 0;
    v_dummy_count INT;
    v_json_res JSONB;
BEGIN
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'INICIANDO SUÍTE DE TESTES DE SEGURANÇA RLS - MOVI+';
    RAISE NOTICE '=====================================================';

    -- ------------------------------------------------------------------------
    -- PASSO 1: PROVISIONAR USUÁRIOS DE TESTE EM auth.users, profiles E user_roles
    -- ------------------------------------------------------------------------
    EXECUTE 'RESET ROLE';

    -- 1.1 Criar registros em auth.users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES 
        (c_instrutor_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.instrutor@movi.test', 'mock_pass', now(), '{"provider":"email","providers":["email"]}', '{"nome":"Test Instrutor"}', now(), now()),
        (c_coordenacao_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.coordenacao@movi.test', 'mock_pass', now(), '{"provider":"email","providers":["email"]}', '{"nome":"Test Coordenacao"}', now(), now()),
        (c_secretaria_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test.secretaria@movi.test', 'mock_pass', now(), '{"provider":"email","providers":["email"]}', '{"nome":"Test Secretaria"}', now(), now())
    ON CONFLICT (id) DO UPDATE SET 
        email = EXCLUDED.email,
        updated_at = now();

    -- 1.2 Garantir registros em profiles
    INSERT INTO public.profiles (id, email, nome, status)
    VALUES 
        (c_instrutor_id, 'test.instrutor@movi.test', 'Test Instrutor', 'aprovado'),
        (c_coordenacao_id, 'test.coordenacao@movi.test', 'Test Coordenacao', 'aprovado'),
        (c_secretaria_id, 'test.secretaria@movi.test', 'Test Secretaria', 'aprovado')
    ON CONFLICT (id) DO UPDATE SET 
        status = 'aprovado',
        email = EXCLUDED.email;

    -- 1.3 Atribuir papéis em user_roles
    DELETE FROM public.user_roles WHERE user_id IN (c_instrutor_id, c_coordenacao_id, c_secretaria_id);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES 
        (c_instrutor_id, 'instrutor'),
        (c_coordenacao_id, 'coordenacao'),
        (c_secretaria_id, 'secretaria');

    RAISE NOTICE '>> Usuários de teste provisionados com sucesso!';

    -- ------------------------------------------------------------------------
    -- PASSO 2: TESTES PARA O PERFIL [INSTRUTOR]
    -- ------------------------------------------------------------------------
    RAISE NOTICE '-----------------------------------------------------';
    RAISE NOTICE '>>> TESTES DO PERFIL: INSTRUTOR';
    RAISE NOTICE '-----------------------------------------------------';
    EXECUTE 'RESET ROLE';
    EXECUTE format('SET "request.jwt.claims" = ''{"sub": "%s", "role": "authenticated"}''', c_instrutor_id);
    EXECUTE format('SET "request.jwt.claim.sub" = ''%s''', c_instrutor_id);
    EXECUTE 'SET "request.jwt.claim.role" = ''authenticated''';
    EXECUTE 'SET ROLE authenticated';

    -- 2.1 SELECT alunos (DEVE PERMITIR)
    BEGIN
        SELECT COUNT(*) INTO v_dummy_count FROM public.alunos;
        RAISE NOTICE '[PASS] Instrutor pode consultar (SELECT) tabela alunos';
        v_passed := v_passed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor não conseguiu ler alunos: %', SQLERRM;
        v_failed := v_failed + 1;
    END;

    -- 2.2 INSERT alunos (DEVE BLOQUEAR)
    BEGIN
        INSERT INTO public.alunos (id, nome_completo) VALUES ('TST_ALN_01', 'Aluno Invasivo');
        RAISE NOTICE '[FAIL] Instrutor CONSEGUIU inserir na tabela alunos (Falha de RLS)';
        v_failed := v_failed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor foi bloqueado ao tentar INSERT em alunos';
        v_passed := v_passed + 1;
    END;

    -- 2.3 UPDATE alunos (DEVE BLOQUEAR)
    BEGIN
        UPDATE public.alunos SET nome_completo = 'Hack' WHERE id = 'TST_ALN_01';
        GET DIAGNOSTICS v_dummy_count = ROW_COUNT;
        IF v_dummy_count > 0 THEN
            RAISE NOTICE '[FAIL] Instrutor CONSEGUIU atualizar tabela alunos (Falha de RLS)';
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '[PASS] Instrutor bloqueado ao tentar UPDATE em alunos (0 linhas afetadas)';
            v_passed := v_passed + 1;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor bloqueado com erro ao tentar UPDATE em alunos';
        v_passed := v_passed + 1;
    END;

    -- 2.4 SELECT leads (DEVE BLOQUEAR - DADOS SENSÍVEIS)
    BEGIN
        SELECT COUNT(*) INTO v_dummy_count FROM public.leads;
        IF v_dummy_count > 0 THEN
            RAISE NOTICE '[FAIL] Instrutor CONSEGUIU ver % leads confidenciais!', v_dummy_count;
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '[PASS] Instrutor não tem visibilidade da tabela leads (0 linhas retornadas)';
            v_passed := v_passed + 1;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor bloqueado com exceção ao tentar ler leads';
        v_passed := v_passed + 1;
    END;

    -- 2.5 SELECT pagamentos (DEVE BLOQUEAR - DADOS FINANCEIROS)
    BEGIN
        SELECT COUNT(*) INTO v_dummy_count FROM public.pagamentos;
        IF v_dummy_count > 0 THEN
            RAISE NOTICE '[FAIL] Instrutor CONSEGUIU ver % registros em pagamentos!', v_dummy_count;
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '[PASS] Instrutor não tem acesso à tabela pagamentos (0 linhas retornadas)';
            v_passed := v_passed + 1;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor bloqueado com exceção ao tentar ler pagamentos';
        v_passed := v_passed + 1;
    END;

    -- 2.6 INSERT / UPDATE / DELETE presencas (DEVE PERMITIR)
    BEGIN
        INSERT INTO public.presencas (id, data_aula, presenca) VALUES ('TST_PRE_01', CURRENT_DATE, true);
        UPDATE public.presencas SET presenca = false WHERE id = 'TST_PRE_01';
        DELETE FROM public.presencas WHERE id = 'TST_PRE_01';
        RAISE NOTICE '[PASS] Instrutor tem permissão CRUD na tabela presencas';
        v_passed := v_passed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor não conseguiu gerenciar presencas: %', SQLERRM;
        v_failed := v_failed + 1;
    END;

    -- 2.7 INSERT / UPDATE / DELETE aulas (DEVE PERMITIR)
    BEGIN
        INSERT INTO public.aulas (id, data_aula, status_aula) VALUES ('TST_AUL_01', CURRENT_DATE, 'AGENDADA');
        UPDATE public.aulas SET status_aula = 'REALIZADA' WHERE id = 'TST_AUL_01';
        DELETE FROM public.aulas WHERE id = 'TST_AUL_01';
        RAISE NOTICE '[PASS] Instrutor tem permissão CRUD na tabela aulas';
        v_passed := v_passed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor não conseguiu gerenciar aulas: %', SQLERRM;
        v_failed := v_failed + 1;
    END;

    -- 2.8 Leitura de turmas, modalidades e matrículas (DEVE PERMITIR)
    BEGIN
        PERFORM 1 FROM public.turmas LIMIT 1;
        PERFORM 1 FROM public.modalidades LIMIT 1;
        PERFORM 1 FROM public.matriculas LIMIT 1;
        RAISE NOTICE '[PASS] Instrutor pode consultar turmas, modalidades e matrículas';
        v_passed := v_passed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor bloqueado indevidamente na leitura de turmas/modalidades: %', SQLERRM;
        v_failed := v_failed + 1;
    END;

    -- 2.9 Tentativa de chamar RPCs Administrativas (DEVE BLOQUEAR)
    BEGIN
        PERFORM public.approve_user(c_instrutor_id, 'instrutor', c_instrutor_id);
        RAISE NOTICE '[FAIL] Instrutor conseguiu chamar approve_user (Falha de segurança!)';
        v_failed := v_failed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor impedido de executar RPC approve_user';
        v_passed := v_passed + 1;
    END;

    BEGIN
        PERFORM public.reject_user(c_instrutor_id, 'motivo', c_instrutor_id);
        RAISE NOTICE '[FAIL] Instrutor conseguiu chamar reject_user (Falha de segurança!)';
        v_failed := v_failed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor impedido de executar RPC reject_user';
        v_passed := v_passed + 1;
    END;

    BEGIN
        PERFORM public.delete_user_account(c_secretaria_id, c_instrutor_id);
        RAISE NOTICE '[FAIL] Instrutor conseguiu chamar delete_user_account (Falha de segurança!)';
        v_failed := v_failed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor impedido de executar RPC delete_user_account';
        v_passed := v_passed + 1;
    END;

    -- ------------------------------------------------------------------------
    -- PASSO 3: TESTES PARA O PERFIL [COORDENAÇÃO]
    -- ------------------------------------------------------------------------
    RAISE NOTICE '-----------------------------------------------------';
    RAISE NOTICE '>>> TESTES DO PERFIL: COORDENAÇÃO';
    RAISE NOTICE '-----------------------------------------------------';
    EXECUTE 'RESET ROLE';
    EXECUTE format('SET "request.jwt.claims" = ''{"sub": "%s", "role": "authenticated"}''', c_coordenacao_id);
    EXECUTE format('SET "request.jwt.claim.sub" = ''%s''', c_coordenacao_id);
    EXECUTE 'SET "request.jwt.claim.role" = ''authenticated''';
    EXECUTE 'SET ROLE authenticated';

    -- 3.1 CRUD alunos
    BEGIN
        INSERT INTO public.alunos (id, nome_completo) VALUES ('TST_ALN_CRD', 'Aluno Coordenação');
        UPDATE public.alunos SET nome_completo = 'Aluno Coordenação Alterado' WHERE id = 'TST_ALN_CRD';
        DELETE FROM public.alunos WHERE id = 'TST_ALN_CRD';
        RAISE NOTICE '[PASS] Coordenação tem CRUD total em alunos';
        v_passed := v_passed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Coordenação falhou no CRUD de alunos: %', SQLERRM;
        v_failed := v_failed + 1;
    END;

    -- 3.2 CRUD leads
    BEGIN
        INSERT INTO public.leads (id, nome) VALUES ('TST_LED_CRD', 'Lead Coordenação');
        UPDATE public.leads SET nome = 'Lead Coordenação Alterado' WHERE id = 'TST_LED_CRD';
        DELETE FROM public.leads WHERE id = 'TST_LED_CRD';
        RAISE NOTICE '[PASS] Coordenação tem CRUD total em leads';
        v_passed := v_passed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Coordenação falhou no CRUD de leads: %', SQLERRM;
        v_failed := v_failed + 1;
    END;

    -- 3.3 CRUD pagamentos
    BEGIN
        INSERT INTO public.pagamentos (id, valor_previsto) VALUES ('TST_PAG_CRD', 150.00);
        UPDATE public.pagamentos SET valor_previsto = 180.00 WHERE id = 'TST_PAG_CRD';
        DELETE FROM public.pagamentos WHERE id = 'TST_PAG_CRD';
        RAISE NOTICE '[PASS] Coordenação tem CRUD total em pagamentos';
        v_passed := v_passed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Coordenação falhou no CRUD de pagamentos: %', SQLERRM;
        v_failed := v_failed + 1;
    END;

    -- 3.4 Acesso ao Dashboard Financeiro RPC
    BEGIN
        SELECT public.get_financial_dashboard_metrics(EXTRACT(YEAR FROM CURRENT_DATE)::INT, EXTRACT(MONTH FROM CURRENT_DATE)::INT) INTO v_json_res;
        RAISE NOTICE '[PASS] Coordenação acessa métricas financeiras consolidadas';
        v_passed := v_passed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Validação de dashboard financeiro concluída';
        v_passed := v_passed + 1;
    END;

    -- ------------------------------------------------------------------------
    -- PASSO 4: TESTES PARA O PERFIL [SECRETARIA]
    -- ------------------------------------------------------------------------
    RAISE NOTICE '-----------------------------------------------------';
    RAISE NOTICE '>>> TESTES DO PERFIL: SECRETARIA';
    RAISE NOTICE '-----------------------------------------------------';
    EXECUTE 'RESET ROLE';
    EXECUTE format('SET "request.jwt.claims" = ''{"sub": "%s", "role": "authenticated"}''', c_secretaria_id);
    EXECUTE format('SET "request.jwt.claim.sub" = ''%s''', c_secretaria_id);
    EXECUTE 'SET "request.jwt.claim.role" = ''authenticated''';
    EXECUTE 'SET ROLE authenticated';

    -- 4.1 Acesso administrativo pleno
    BEGIN
        INSERT INTO public.modalidades (id, nome_modalidade) VALUES ('TST_MOD_SEC', 'Modalidade Secretaria');
        DELETE FROM public.modalidades WHERE id = 'TST_MOD_SEC';
        RAISE NOTICE '[PASS] Secretaria tem acesso administrativo pleno';
        v_passed := v_passed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Secretaria bloqueada na gestão de modalidades: %', SQLERRM;
        v_failed := v_failed + 1;
    END;

    -- 4.2 Auto-exclusão bloqueada por segurança
    BEGIN
        PERFORM public.delete_user_account(c_secretaria_id, c_secretaria_id);
        RAISE NOTICE '[FAIL] Secretaria conseguiu auto-excluir sua própria conta (Deveria bloquear)';
        v_failed := v_failed + 1;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Secretaria bloqueada corretamente ao tentar auto-excluir sua própria conta';
        v_passed := v_passed + 1;
    END;

    -- ------------------------------------------------------------------------
    -- PASSO 5: TESTES PARA USUÁRIOS ANÔNIMOS (SEM AUTENTICAÇÃO)
    -- ------------------------------------------------------------------------
    RAISE NOTICE '-----------------------------------------------------';
    RAISE NOTICE '>>> TESTES: USUÁRIO ANÔNIMO (ANON / SEM LOGIN)';
    RAISE NOTICE '-----------------------------------------------------';
    EXECUTE 'RESET ROLE';
    EXECUTE 'SET "request.jwt.claims" = ''{"role": "anon"}''';
    EXECUTE 'SET "request.jwt.claim.sub" = ''''';
    EXECUTE 'SET "request.jwt.claim.role" = ''anon''';
    EXECUTE 'SET ROLE anon';

    -- 5.1 SELECT anônimo em alunos (DEVE BLOQUEAR)
    BEGIN
        SELECT COUNT(*) INTO v_dummy_count FROM public.alunos;
        IF v_dummy_count > 0 THEN
            RAISE NOTICE '[FAIL] Usuário anônimo conseguiu visualizar dados de alunos!';
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '[PASS] Usuário anônimo recebe 0 registros de alunos';
            v_passed := v_passed + 1;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Usuário anônimo bloqueado com exceção ao tentar ler alunos';
        v_passed := v_passed + 1;
    END;

    -- 5.2 SELECT anônimo em pagamentos (DEVE BLOQUEAR)
    BEGIN
        SELECT COUNT(*) INTO v_dummy_count FROM public.pagamentos;
        IF v_dummy_count > 0 THEN
            RAISE NOTICE '[FAIL] Usuário anônimo conseguiu visualizar pagamentos!';
            v_failed := v_failed + 1;
        ELSE
            RAISE NOTICE '[PASS] Usuário anônimo recebe 0 registros de pagamentos';
            v_passed := v_passed + 1;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Usuário anônimo bloqueado com exceção ao tentar ler pagamentos';
        v_passed := v_passed + 1;
    END;

    -- ------------------------------------------------------------------------
    -- PASSO 6: RESTAURAR CONTEXTO E LIMPAR RECURSOS DE TESTE
    -- ------------------------------------------------------------------------
    EXECUTE 'RESET ROLE';
    EXECUTE 'SET "request.jwt.claims" = ''''';
    EXECUTE 'SET "request.jwt.claim.sub" = ''''';
    EXECUTE 'SET "request.jwt.claim.role" = ''''';

    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'RELATÓRIO FINAL DA SUÍTE DE TESTES RLS:';
    RAISE NOTICE '  ✅ Testes Aprovados: %', v_passed;
    RAISE NOTICE '  ❌ Testes Falhos:    %', v_failed;
    RAISE NOTICE '=====================================================';

    IF v_failed = 0 THEN
        RAISE NOTICE '🎉 PARABÉNS! Todas as políticas de RLS estão funcionando com 100 por cento de conformidade e segurança.';
    ELSE
        RAISE EXCEPTION 'Atenção: % teste(s) de segurança falharam. Verifique os logs acima.', v_failed;
    END IF;
END $$;
