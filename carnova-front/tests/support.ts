import type { Page, APIRequestContext } from '@playwright/test';
export async function adminSession(page: Page, request: APIRequestContext) {
  const response = await request.post('/api/auth/signin', {
    data: {
      email: 'admin@carnova.local',
      password: process.env['E2E_ADMIN_PASSWORD'] ?? 'portfolio-admin-demo-only',
    },
  });
  if (!response.ok())
    throw new Error('Local demo administrator login failed: ' + response.status());
  const session = await response.json();
  session.expiresAt = Date.now() + session.expiresIn * 1000;
  await page.addInitScript((value) => {
    sessionStorage.setItem('carnova-session', JSON.stringify(value));
    localStorage.setItem('carnova-theme', 'light');
  }, session);
}
