import { test as base, expect } from '@playwright/test';

export function generateCPF(): string {
  const num = (n: number) => Math.floor(Math.random() * n);
  const n = [num(9), num(9), num(9), num(9), num(9), num(9), num(9), num(9), num(9)];
  
  let d1 = n[8]*2 + n[7]*3 + n[6]*4 + n[5]*5 + n[4]*6 + n[3]*7 + n[2]*8 + n[1]*9 + n[0]*10;
  d1 = 11 - (d1 % 11);
  if (d1 >= 10) d1 = 0;
  
  let d2 = d1*2 + n[8]*3 + n[7]*4 + n[6]*5 + n[5]*6 + n[4]*7 + n[3]*8 + n[2]*9 + n[1]*10 + n[0]*11;
  d2 = 11 - (d2 % 11);
  if (d2 >= 10) d2 = 0;

  return `${n.join('')}${d1}${d2}`;
}

export const test = base.extend<{
  mockAuth: (role?: 'secretaria' | 'coordenacao' | 'instrutor', email?: string) => Promise<void>;
}>({
  mockAuth: async ({ page }, use) => {
    const fn = async (role: 'secretaria' | 'coordenacao' | 'instrutor' = 'secretaria', email: string = 'secretaria@movi.test') => {
      const userId = role === 'instrutor' ? 'instrutor-uuid-123' : 'secretaria-uuid-123';
      const inMemoryAlunos: any[] = [];

      await page.route('**/auth/v1/token?grant_type=password', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'mock-access-token-xyz',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token-xyz',
            user: {
              id: userId,
              aud: 'authenticated',
              role: 'authenticated',
              email,
              email_confirmed_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
          }),
        });
      });

      await page.route('**/rest/v1/profiles?select=*&id=eq.' + userId, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: userId,
            email,
            status: 'aprovado',
            created_at: new Date().toISOString(),
          }),
        });
      });

      await page.route('**/rest/v1/user_roles?select=role&user_id=eq.' + userId, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ role }]),
        });
      });

      await page.route('**/rest/v1/user_roles?select=*&user_id=eq.' + userId, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ role }]),
        });
      });

      // Mock CRUD para a tabela alunos
      await page.route('**/rest/v1/alunos*', async (route) => {
        const method = route.request().method();
        if (method === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(inMemoryAlunos),
          });
        } else if (method === 'POST') {
          const postData = route.request().postDataJSON();
          if (Array.isArray(postData)) {
            inMemoryAlunos.push(...postData);
          } else if (postData) {
            inMemoryAlunos.push(postData);
          }
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(postData),
          });
        } else if (method === 'DELETE') {
          const url = route.request().url();
          const match = url.match(/id=eq\.([^&]+)/);
          if (match && match[1]) {
            const idx = inMemoryAlunos.findIndex(a => a.id === match[1]);
            if (idx !== -1) inMemoryAlunos.splice(idx, 1);
          } else {
            inMemoryAlunos.length = 0;
          }
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
        } else {
          await route.continue();
        }
      });

      await page.route('**/auth/v1/logout', async (route) => {
        await route.fulfill({ status: 200, json: {} });
      });
    };
    await use(fn);
  },
});

export { expect };
