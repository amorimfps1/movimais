import { test, expect, generateCPF } from '../playwright-fixture';

test.describe('MOVI+ — Fluxo de Autenticação e CRUD', () => {
  const TEST_EMAIL = 'secretaria@movi.test';
  const TEST_PASSWORD = 'Teste@123';

  test('Login completo, navegação e CRUD de aluno', async ({ page, mockAuth }) => {
    await mockAuth('secretaria', TEST_EMAIL);

    await page.goto('/auth');
    await expect(page.getByText('Acesso ao Sistema')).toBeVisible();

    await page.getByPlaceholder('seu@email.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();

    await page.waitForURL('/', { timeout: 10000 });

    // Clica no link Alunos na barra de navegação
    await page.getByRole('navigation').getByRole('link', { name: 'Alunos' }).click();
    await expect(page.getByText('Gestão da base de alunos')).toBeVisible();

    await page.getByRole('button', { name: /novo aluno/i }).click();
    await expect(page.getByText('Cadastrar Novo Aluno')).toBeVisible();

    const testName = `Teste E2E ${Date.now()}`;
    const testCpf = generateCPF();

    await page.getByPlaceholder('Ex: Maria Clara Souza').fill(testName);
    await page.locator('input[placeholder="000.000.000-00"]').first().fill(testCpf);

    await page.getByRole('button', { name: /cadastrar aluno/i }).click();

    await expect(page.getByText('Aluno cadastrado com sucesso')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(testName)).toBeVisible();

    // Localiza a linha correta da tabela
    const row = page.locator('tr').filter({ hasText: testName });
    await row.getByTitle('Excluir registro').click();
    await page.getByRole('button', { name: /excluir registro/i }).click();
    await expect(page.getByText('Aluno removido com sucesso')).toBeVisible({ timeout: 10000 });
  });

  test('Logout redireciona para /auth', async ({ page, mockAuth }) => {
    await mockAuth('secretaria', TEST_EMAIL);

    await page.goto('/auth');
    await page.getByPlaceholder('seu@email.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await page.waitForURL('/', { timeout: 10000 });

    // Clicar no menu de usuário no topo da navbar
    const userMenuButton = page.locator('header button').filter({ has: page.locator('div.rounded-full') });
    await userMenuButton.click();

    // Clicar em Sair do Sistema
    await page.getByRole('menuitem', { name: 'Sair do Sistema' }).click();

    await expect(page).toHaveURL(/\/auth/);
  });
});
