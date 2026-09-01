import { test, expect } from '../playwright-fixture';

test.describe('MOVI+ — Controle de Acesso por Perfil', () => {
  test('Instrutor não vê links de Leads, Pagamentos e Usuários', async ({ page, mockAuth }) => {
    await mockAuth('instrutor', 'instrutor1@movi.test');

    await page.goto('/auth');
    await page.getByPlaceholder('seu@email.com').fill('instrutor1@movi.test');
    await page.getByPlaceholder('••••••••').fill('Teste@123');
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();

    await page.waitForURL(/\/(aulas)?/, { timeout: 10000 });

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: /leads/i })).not.toBeVisible();
    await expect(nav.getByRole('link', { name: /pagamentos/i })).not.toBeVisible();
    await expect(nav.getByRole('link', { name: /usuários/i })).not.toBeVisible();

    await expect(nav.getByRole('link', { name: /turmas/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /modalidades/i })).toBeVisible();
    await expect(nav.getByRole('link', { name: /presenças/i })).toBeVisible();
  });

  test('Instrutor redirecionado ao tentar acessar /leads diretamente', async ({ page, mockAuth }) => {
    await mockAuth('instrutor', 'instrutor1@movi.test');

    await page.goto('/auth');
    await page.getByPlaceholder('seu@email.com').fill('instrutor1@movi.test');
    await page.getByPlaceholder('••••••••').fill('Teste@123');
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await page.waitForURL(/\/(aulas)?/, { timeout: 10000 });

    await page.goto('/leads');

    await expect(page).not.toHaveURL(/\/leads/);
  });

  test('Secretaria tem acesso completo incluindo Usuários', async ({ page, mockAuth }) => {
    await mockAuth('secretaria', 'secretaria@movi.test');

    await page.goto('/auth');
    await page.getByPlaceholder('seu@email.com').fill('secretaria@movi.test');
    await page.getByPlaceholder('••••••••').fill('Teste@123');
    await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
    await page.waitForURL('/', { timeout: 10000 });

    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Alunos' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Leads' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Pagamentos' })).toBeVisible();
    await expect(nav.getByRole('link', { name: /usuários/i })).toBeVisible();
  });
});
