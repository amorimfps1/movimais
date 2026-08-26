import { test, expect } from '@playwright/test';

test.describe('MOVI+ — Controle de Acesso por Perfil', () => {
  test('Instrutor não vê links de Leads, Pagamentos e Usuários', async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('seu@email.com').fill('instrutor1@movi.test');
    await page.getByPlaceholder('••••••••').fill('Teste@123');
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();

    await page.waitForURL(/\/(aulas)?/, { timeout: 10000 });

    await expect(page.getByRole('link', { name: /leads/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /pagamentos/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /usuários/i })).not.toBeVisible();

    await expect(page.getByRole('link', { name: /turmas/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /modalidades/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /presenças/i })).toBeVisible();
  });

  test('Instrutor redirecionado ao tentar acessar /leads diretamente', async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('seu@email.com').fill('instrutor1@movi.test');
    await page.getByPlaceholder('••••••••').fill('Teste@123');
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await page.waitForURL(/\/(aulas)?/, { timeout: 10000 });

    await page.goto('/leads');

    await expect(page).not.toHaveURL(/\/leads/);
  });

  test('Secretaria tem acesso completo incluindo Usuários', async ({ page }) => {
    await page.goto('/auth');
    await page.getByPlaceholder('seu@email.com').fill('secretaria@movi.test');
    await page.getByPlaceholder('••••••••').fill('Teste@123');
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await page.waitForURL('/', { timeout: 10000 });

    await expect(page.getByRole('link', { name: /alunos/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /leads/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /pagamentos/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /usuários/i })).toBeVisible();
  });
});
