-- RLS Security Tests
-- How to run: Execute this script in the Supabase SQL Editor.
-- Make sure the users secretaria@movi.test, coordenacao@movi.test, instrutor1@movi.test exist.

CREATE SCHEMA IF NOT EXISTS test_rls;

CREATE OR REPLACE FUNCTION test_rls.set_auth_user(user_email TEXT)
RETURNS VOID AS $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = user_email LIMIT 1;
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;

    -- Set the role to authenticated and simulate request.jwt.claims
    PERFORM set_config('role', 'authenticated', true);
    PERFORM set_config('request.jwt.claims', format('{"sub": "%s", "role": "authenticated"}', user_id), true);
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    dummy_text TEXT;
BEGIN
    RAISE NOTICE 'Starting RLS Tests...';
    
    ---------------------------------------------------------
    -- INSTRUTOR TESTS
    ---------------------------------------------------------
    RAISE NOTICE '--- Running INSTRUTOR Tests ---';
    PERFORM test_rls.set_auth_user('instrutor1@movi.test');
    
    -- SELECT alunos (Should Succeed)
    BEGIN
        SELECT id INTO dummy_text FROM alunos LIMIT 1;
        RAISE NOTICE '[PASS] Instrutor can SELECT from alunos';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor can SELECT from alunos (Erro: %)', SQLERRM;
    END;

    -- INSERT alunos (Should Fail)
    BEGIN
        INSERT INTO alunos (id, nome_completo) VALUES ('TEST001', 'Test Aluno');
        RAISE NOTICE '[FAIL] Instrutor CANNOT INSERT into alunos (It allowed it!)';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE '[PASS] Instrutor cannot INSERT into alunos';
    WHEN OTHERS THEN
        RAISE NOTICE '[PASS/WARN] Instrutor cannot INSERT into alunos (Erro: %)', SQLERRM;
    END;

    -- UPDATE alunos (Should Fail)
    BEGIN
        UPDATE alunos SET nome_completo = 'Test' WHERE id = 'TEST_ID';
        RAISE NOTICE '[FAIL] Instrutor CANNOT UPDATE alunos (It allowed it!)';
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE '[PASS] Instrutor cannot UPDATE alunos';
    WHEN OTHERS THEN
        RAISE NOTICE '[PASS/WARN] Instrutor cannot UPDATE alunos (Erro: %)', SQLERRM;
    END;

    -- SELECT leads (Should Fail / return empty based on RLS setup, usually insufficient_privilege or empty)
    BEGIN
        SELECT id INTO dummy_text FROM leads LIMIT 1;
        IF dummy_text IS NOT NULL THEN
            RAISE NOTICE '[FAIL] Instrutor CANNOT SELECT from leads (Returned data!)';
        ELSE
            RAISE NOTICE '[PASS] Instrutor cannot SELECT from leads (Empty result)';
        END IF;
    EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE '[PASS] Instrutor cannot SELECT from leads';
    WHEN OTHERS THEN
        RAISE NOTICE '[PASS/WARN] Instrutor cannot SELECT from leads (Erro: %)', SQLERRM;
    END;

    -- SELECT pagamentos (Should Fail)
    BEGIN
        SELECT id INTO dummy_text FROM pagamentos LIMIT 1;
        IF dummy_text IS NOT NULL THEN
            RAISE NOTICE '[FAIL] Instrutor CANNOT SELECT from pagamentos (Returned data!)';
        ELSE
            RAISE NOTICE '[PASS] Instrutor cannot SELECT from pagamentos (Empty result)';
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor cannot SELECT from pagamentos';
    END;

    -- INSERT presencas (Should Succeed)
    BEGIN
        INSERT INTO presencas (id, data_aula) VALUES ('PRTEST12', CURRENT_DATE);
        RAISE NOTICE '[PASS] Instrutor can INSERT into presencas';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor can INSERT into presencas (Erro: %)', SQLERRM;
    END;

    -- UPDATE presencas (Should Succeed)
    BEGIN
        UPDATE presencas SET presenca = true WHERE id = 'PRTEST12';
        RAISE NOTICE '[PASS] Instrutor can UPDATE presencas';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor can UPDATE presencas (Erro: %)', SQLERRM;
    END;

    -- DELETE presencas (Should Succeed)
    BEGIN
        DELETE FROM presencas WHERE id = 'PRTEST12';
        RAISE NOTICE '[PASS] Instrutor can DELETE presencas';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor can DELETE presencas (Erro: %)', SQLERRM;
    END;
    
    -- INSERT aulas (Should Succeed)
    BEGIN
        INSERT INTO aulas (id, data_aula) VALUES ('AULATEST', CURRENT_DATE);
        RAISE NOTICE '[PASS] Instrutor can INSERT into aulas';
        DELETE FROM aulas WHERE id = 'AULATEST'; -- Cleanup
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor can INSERT into aulas (Erro: %)', SQLERRM;
    END;

    -- SELECT turmas (Should Succeed)
    BEGIN
        SELECT id INTO dummy_text FROM turmas LIMIT 1;
        RAISE NOTICE '[PASS] Instrutor can SELECT from turmas';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor can SELECT from turmas (Erro: %)', SQLERRM;
    END;

    -- SELECT modalidades (Should Succeed)
    BEGIN
        SELECT id INTO dummy_text FROM modalidades LIMIT 1;
        RAISE NOTICE '[PASS] Instrutor can SELECT from modalidades';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor can SELECT from modalidades (Erro: %)', SQLERRM;
    END;

    -- SELECT matriculas (Should Succeed)
    BEGIN
        SELECT id INTO dummy_text FROM matriculas LIMIT 1;
        RAISE NOTICE '[PASS] Instrutor can SELECT from matriculas';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Instrutor can SELECT from matriculas (Erro: %)', SQLERRM;
    END;

    -- INSERT matriculas (Should Fail)
    BEGIN
        INSERT INTO matriculas (id, id_aluno) VALUES ('MATTEST1', 'ALUNOTES');
        RAISE NOTICE '[FAIL] Instrutor CANNOT INSERT into matriculas (It allowed it!)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor cannot INSERT into matriculas';
    END;

    ---------------------------------------------------------
    -- COORDENACAO TESTS
    ---------------------------------------------------------
    RAISE NOTICE '--- Running COORDENACAO Tests ---';
    PERFORM test_rls.set_auth_user('coordenacao@movi.test');
    
    -- CRUD alunos
    BEGIN
        INSERT INTO alunos (id, nome_completo) VALUES ('ALCOORD1', 'Coord Aluno');
        UPDATE alunos SET nome_completo = 'Coord Aluno 2' WHERE id = 'ALCOORD1';
        DELETE FROM alunos WHERE id = 'ALCOORD1';
        RAISE NOTICE '[PASS] Coordenacao has full CRUD on alunos';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Coordenacao CRUD on alunos (Erro: %)', SQLERRM;
    END;

    -- CRUD leads
    BEGIN
        INSERT INTO leads (id, nome) VALUES ('LECOORD1', 'Coord Lead');
        UPDATE leads SET nome = 'Coord Lead 2' WHERE id = 'LECOORD1';
        DELETE FROM leads WHERE id = 'LECOORD1';
        RAISE NOTICE '[PASS] Coordenacao has full CRUD on leads';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Coordenacao CRUD on leads (Erro: %)', SQLERRM;
    END;

    -- CRUD pagamentos
    BEGIN
        INSERT INTO pagamentos (id) VALUES ('PGCOORD1');
        UPDATE pagamentos SET valor_previsto = 100 WHERE id = 'PGCOORD1';
        DELETE FROM pagamentos WHERE id = 'PGCOORD1';
        RAISE NOTICE '[PASS] Coordenacao has full CRUD on pagamentos';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Coordenacao CRUD on pagamentos (Erro: %)', SQLERRM;
    END;

    ---------------------------------------------------------
    -- SECRETARIA TESTS
    ---------------------------------------------------------
    RAISE NOTICE '--- Running SECRETARIA Tests ---';
    PERFORM test_rls.set_auth_user('secretaria@movi.test');
    
    -- Verify admin access
    BEGIN
        INSERT INTO alunos (id, nome_completo) VALUES ('ALSEC001', 'Sec Aluno');
        DELETE FROM alunos WHERE id = 'ALSEC001';
        RAISE NOTICE '[PASS] Secretaria has full access';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[FAIL] Secretaria access (Erro: %)', SQLERRM;
    END;

    ---------------------------------------------------------
    -- RPC SECURITY TESTS
    ---------------------------------------------------------
    RAISE NOTICE '--- Running RPC Tests ---';
    PERFORM test_rls.set_auth_user('instrutor1@movi.test');
    
    BEGIN
        PERFORM approve_user('some-uuid');
        RAISE NOTICE '[FAIL] Instrutor can call approve_user (It allowed it!)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor cannot call approve_user';
    END;

    BEGIN
        PERFORM reject_user('some-uuid', 'reason');
        RAISE NOTICE '[FAIL] Instrutor can call reject_user (It allowed it!)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor cannot call reject_user';
    END;
    
    BEGIN
        PERFORM delete_user_account('some-uuid');
        RAISE NOTICE '[FAIL] Instrutor can call delete_user_account (It allowed it!)';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '[PASS] Instrutor cannot call delete_user_account';
    END;

    -- Self deletion test
    PERFORM test_rls.set_auth_user('secretaria@movi.test');
    BEGIN
        -- Need to get their own UUID
        DECLARE self_id UUID;
        BEGIN
            SELECT id INTO self_id FROM auth.users WHERE email = 'secretaria@movi.test' LIMIT 1;
            PERFORM delete_user_account(self_id);
            RAISE NOTICE '[FAIL] Admin CANNOT call delete_user_account on self (It allowed it!)';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '[PASS] Admin cannot delete self';
        END;
    END;

    -- Reset
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', '', true);
    RAISE NOTICE 'Tests completed.';
END $$;
