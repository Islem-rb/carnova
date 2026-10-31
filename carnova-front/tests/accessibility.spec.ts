import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { adminSession } from './support';

test('accessibility: main desktop and mobile pages meet automated WCAG AA checks', async ({
  page,
  request,
}) => {
  test.setTimeout(300000);
  await adminSession(page, request);
  const pages = [
    '/',
    '/annonces',
    '/annonces/1',
    '/login',
    '/inscription',
    '/showrooms',
    '/showrooms/1',
    '/actualites',
    '/guide/fcr',
    '/about',
    '/contact',
    '/espace',
    '/espace/creer-annonce',
    '/espace/creer-showroom',
    '/admin',
    '/studio',
  ];
  for (const mobile of [false, true]) {
    await page.setViewportSize(
      mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
    );
    for (const path of pages) {
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
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        results.violations,
        `${path} ${mobile ? 'mobile' : 'desktop'}: ${JSON.stringify(results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
      ).toEqual([]);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        path + ' should fit viewport',
      ).toBe(true);
    }
  }
  for (const path of ['/', '/annonces', '/login', '/espace', '/admin', '/studio']) {
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
    await page.getByRole('button', { name: 'Activer le mode sombre' }).click();
    await page
      .locator('.skeleton')
      .first()
      .waitFor({ state: 'hidden' })
      .catch(() => {});
    if (path === '/studio')
      await expect(page.locator('.viewer-loading')).toBeHidden({ timeout: 60000 });
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations, path + ' dark mode').toEqual([]);
  }
  await page.setViewportSize({ width: 320, height: 740 });
  for (const path of pages) {
    await page.goto(path);
    await expect(page.locator('main h1').first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      path + ' at 320px',
    ).toBe(true);
  }
  await page.getByRole('button', { name: /Ouvrir l’assistant CarNova/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const dialog = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(dialog.violations).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
