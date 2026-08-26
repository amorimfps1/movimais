import { test, expect } from '@playwright/test';

test.describe('MOVI+ — Fluxo de Autenticação e CRUD', () => {
  const TEST_EMAIL = process.env.TEST_EMAIL || 'secretaria@movi.test';
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Teste@123';

  test('Login completo, navegação e CRUD de aluno', async ({ page }) => {
    await page.goto('/auth');
    await expect(page.getByText('Acesso ao Sistema')).toBeVisible();

    await page.getByPlaceholder('seu@email.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();

    await page.waitForURL('/', { timeout: 10000 });

    await page.getByRole('link', { name: /alunos/i }).click();
    await expect(page.getByText('Gestão da base de alunos')).toBeVisible();

    await page.getByRole('button', { name: /novo aluno/i }).click();
    await expect(page.getByText('Cadastrar Novo Aluno')).toBeVisible();

    const testName = `Teste E2E ${Date.now()}`;
    await page.getByLabel(/nome completo/i).fill(testName);
    await page.locator('input[placeholder="000.000.000-00"]').first().fill('529.982.247-25');

    await page.getByRole('button', { name: /cadastrar aluno/i }).click();

    await expect(page.getByText('Aluno cadastrado com sucesso')).toBeVisible({ timeout: 5000 });

    await expect(page.getByText(testName)).toBeVisible();

    const row = page.getByText(testName).locator('..').locator('..');
    await row.getByTitle('Excluir registro').click();
    await page.getByRole('button', { name: /excluir registro/i }).click();
    await expect(page.getByText('Aluno removido com sucesso')).toBeVisible({ timeout: 5000 });
  });

  test('Logout redireciona para /auth', async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('seu@email.com').fill(TEST_EMAIL);
    await page.getByPlaceholder('••••••••').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await page.waitForURL('/', { timeout: 10000 });

    const logoutBtn = page.getByTitle(/desconectar|sair|logout/i).or(page.getByText(/desconectar|sair/i));
    await logoutBtn.click();

    await expect(page).toHaveURL(/\/auth/);
  });
});
