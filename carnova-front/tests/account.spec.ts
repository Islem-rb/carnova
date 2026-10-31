import { test, expect, APIRequestContext } from '@playwright/test';

const mailbox = process.env['E2E_MAILPIT_URL'] ?? 'http://localhost:8025';
async function mailLink(request: APIRequestContext, email: string, subject: string) {
  let link = '';
  await expect
    .poll(
      async () => {
        const result = await request.get(mailbox + '/api/v1/search', {
          params: { query: 'to:' + email },
        });
        if (!result.ok()) return false;
        const index = (await result.json()) as { messages: { ID: string; Subject: string }[] };
        const summary = index.messages.find((item) => item.Subject.includes(subject));
        if (!summary) return false;
        const response = await request.get(mailbox + '/api/v1/message/' + summary.ID);
        if (!response.ok()) return false;
        const message = (await response.json()) as { Text: string };
        link = message.Text.match(/https?:\/\/[^\s]+/)?.[0] ?? '';
        return Boolean(link);
      },
      { timeout: 30000, message: 'The local capture inbox should receive the account link' },
    )
    .toBe(true);
  return link;
}

test('account: verify email, update profile, change password and recover access through local mail', async ({
  page,
  request,
}, testInfo) => {
  test.setTimeout(150000);
  const email = `account-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const original = 'AccountOriginal123!';
  const changed = 'AccountChanged123!';
  const recovered = 'AccountRecovered123!';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/inscription');
  await page.getByLabel('Prénom', { exact: true }).fill('Amine');
  await page.getByLabel('Nom', { exact: true }).fill('Client');
  await page.getByLabel('Adresse e-mail', { exact: true }).fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(original);
  await page.getByRole('button', { name: 'Créer mon compte', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Votre compte est prêt.' })).toBeVisible();
  const verify = await mailLink(request, email, 'Confirmez');
  await page.getByRole('link', { name: 'Me connecter', exact: true }).click();
  await page.getByLabel('Adresse e-mail', { exact: true }).fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(original);
  await page.getByRole('button', { name: 'Me connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/espace$/);
  const firstToken = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem('carnova-session')!).token as string,
  );
  await page.getByRole('link', { name: 'Mon compte', exact: true }).click();
  await expect(page.getByLabel('Prénom', { exact: true })).toHaveValue('Amine');
  await page.getByLabel('Nom', { exact: true }).fill('Ben Ali');
  await page.getByRole('button', { name: 'Enregistrer mon profil' }).click();
  await expect(
    page.getByRole('status').filter({ hasText: 'Votre profil a été mis à jour.' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Nom', { exact: true })).toHaveValue('Ben Ali');
  for (const mobile of [false, true]) {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    );
    await page.screenshot({
      path: testInfo.outputPath(`settings-${mobile ? 'mobile' : 'desktop'}.png`),
      fullPage: true,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.goto(verify);
  await expect(page).toHaveURL((url) => url.pathname === '/verifier-email' && url.hash === '');
  await page.screenshot({ path: testInfo.outputPath('verify-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Confirmer mon adresse', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Adresse confirmée.' })).toBeVisible();
  await page.getByRole('link', { name: 'Mon compte', exact: true }).click();
  await expect(page.locator('.settings-badge')).toHaveText('Confirmée');
  await page.getByLabel('Mot de passe actuel', { exact: true }).fill(original);
  await page.getByLabel('Nouveau mot de passe', { exact: true }).fill(changed);
  await page.getByLabel('Confirmer le nouveau mot de passe', { exact: true }).fill(changed);
  await page.getByRole('button', { name: 'Modifier mon mot de passe' }).click();
  await expect(page).toHaveURL(/\/login\?passwordChanged=1$/);
  expect(
    (
      await request.get('/api/auth/me', { headers: { Authorization: 'Bearer ' + firstToken } })
    ).status(),
  ).toBe(401);
  await page.getByLabel('Adresse e-mail', { exact: true }).fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(changed);
  await page.getByRole('button', { name: 'Me connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/espace$/);
  const secondToken = await page.evaluate(
    () => JSON.parse(sessionStorage.getItem('carnova-session')!).token as string,
  );
  await page.goto('/mot-de-passe-oublie');
  await page.getByLabel('Adresse e-mail', { exact: true }).fill(email);
  await page.screenshot({ path: testInfo.outputPath('forgot-mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Recevoir le lien', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Consultez vos e-mails.' })).toBeVisible();
  const reset = await mailLink(request, email, 'Réinitialisez');
  const resetToken = new URLSearchParams(new URL(reset).hash.slice(1)).get('token');
  await page.goto(reset);
  await expect(page).toHaveURL(
    (url) => url.pathname === '/reinitialiser-mot-de-passe' && url.hash === '',
  );
  await page.screenshot({ path: testInfo.outputPath('reset-mobile.png'), fullPage: true });
  await page.getByLabel('Nouveau mot de passe', { exact: true }).fill(recovered);
  await page.getByLabel('Confirmer le nouveau mot de passe', { exact: true }).fill(recovered);
  await page.getByRole('button', { name: 'Enregistrer mon mot de passe' }).click();
  await expect(
    page.getByRole('heading', { name: 'Vous pouvez reprendre la route.' }),
  ).toBeVisible();
  expect(
    (
      await request.get('/api/auth/me', { headers: { Authorization: 'Bearer ' + secondToken } })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post('/api/auth/reset-password', {
        data: { token: resetToken, newPassword: 'CannotReplay123!' },
      })
    ).status(),
  ).toBe(400);
  await page.getByRole('link', { name: 'Me connecter', exact: true }).click();
  await page.getByLabel('Adresse e-mail', { exact: true }).fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(recovered);
  await page.getByRole('button', { name: 'Me connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/espace$/);
  expect(errors).toEqual([]);
});

test('account: incomplete recovery links have an accessible way to restart on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/reinitialiser-mot-de-passe');
  await expect(page.getByRole('heading', { name: 'Un nouveau lien ?' })).toBeVisible();
  await page.getByRole('link', { name: 'Recevoir un nouveau lien' }).click();
  await expect(page.getByLabel('Adresse e-mail', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Recevoir le lien', exact: true }).click();
  await expect(page.getByText('Indiquez une adresse e-mail valide.')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
