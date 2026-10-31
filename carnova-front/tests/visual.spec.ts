import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { adminSession } from './support';

test('visual: desktop and mobile portfolio screenshots with clean browser consoles', async ({
  page,
  request,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await adminSession(page, request);
  const output = resolve('../docs/screenshots');
  await mkdir(output, { recursive: true });
  const pages = [
    ['home', '/'],
    ['listings', '/annonces'],
    ['listing', '/annonces/1'],
    ['auth', '/login'],
    ['showrooms', '/showrooms'],
    ['showroom', '/showrooms/1'],
    ['journal', '/actualites'],
    ['guide', '/guide'],
    ['contact', '/contact'],
    ['account', '/espace'],
    ['publish', '/espace/creer-annonce'],
    ['admin', '/admin'],
    ['studio', '/studio'],
  ];
  for (const mobile of [false, true]) {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    );
    for (const [name, path] of pages) {
      await page.goto(path);
      await expect(page.locator('main h1').first()).toBeVisible();
      await page
        .locator('.skeleton')
        .first()
        .waitFor({ state: 'hidden' })
        .catch(() => {});
      await page.evaluate(() => document.fonts.ready);
      if (path === '/studio')
        await expect(page.locator('.viewer-loading')).toBeHidden({ timeout: 60000 });
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 45));
        }
        window.scrollTo(0, 0);
        await Promise.all(
          Array.from(document.images).map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>((resolve) => {
                  img.onload = () => resolve();
                  img.onerror = () => resolve();
                }),
          ),
        );
      });
      await page.screenshot({
        path: resolve(output, `${name}-${mobile ? 'mobile' : 'desktop'}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  }
  await page.goto('/');
  await page.locator('.theme-button').click();
  await page.screenshot({
    path: resolve(output, 'home-dark-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
  expect(errors).toEqual([]);
});
