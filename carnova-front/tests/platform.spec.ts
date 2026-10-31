import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { adminSession } from './support';

for (const variant of [
  { name: 'desktop', viewport: { width: 1440, height: 1000 }, isMobile: false },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true },
]) {
  test.describe(variant.name, () => {
    test.use({
      viewport: variant.viewport,
      isMobile: variant.isMobile,
      hasTouch: variant.isMobile,
    });
    test('signup, login, publish with photos and GLB, search, assistant and account management', async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      const capture = async (step: string) => {
        await page.evaluate(() => document.fonts.ready);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          variant.name + ': ' + step,
        ).toBe(true);
        await page.screenshot({
          path: testInfo.outputPath(`${step}-${variant.name}.png`),
          fullPage: true,
          animations: 'disabled',
        });
      };
      const email = `browser-${variant.name}-${Date.now()}@example.com`;
      const title = `BMW parcours ${variant.name} ${Date.now()}`;
      await page.goto('/espace/creer-annonce');
      await expect(page).toHaveURL(/login/);
      await page.getByRole('link', { name: 'Créer mon compte', exact: true }).click();
      await page.getByLabel('Prénom', { exact: true }).fill('Camille');
      await page.getByLabel('Nom', { exact: true }).fill('Test');
      await page.getByLabel('Adresse e-mail', { exact: true }).fill(email);
      await page.getByLabel('Mot de passe', { exact: true }).fill('PortfolioTest123!');
      await page.getByRole('button', { name: 'Créer mon compte', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Votre compte est prêt.' })).toBeVisible();
      await capture('signup');
      await page.getByRole('link', { name: 'Me connecter', exact: true }).click();
      await page.getByLabel('Adresse e-mail', { exact: true }).fill(email);
      await page.getByLabel('Mot de passe', { exact: true }).fill('PortfolioTest123!');
      await page.getByRole('button', { name: 'Me connecter', exact: true }).click();
      await expect(page).toHaveURL(/espace\/creer-annonce/);
      await expect(page.getByLabel('Titre de votre annonce')).toBeVisible();
      await capture('login');
      await page.getByLabel('Titre de votre annonce').fill(title);
      await page.getByLabel('Marque *', { exact: true }).fill('BMW');
      await page.getByLabel('Modèle & finition').fill('320i M Sport');
      await page.getByLabel('Année *', { exact: true }).fill('2022');
      await page.getByRole('button', { name: 'Continuer', exact: true }).click();
      await page.getByLabel('Prix (TND)').fill('123456');
      await page.getByLabel('Kilométrage').fill('23000');
      await page.getByLabel('Ville *', { exact: true }).fill('Tunis');
      await page.getByLabel('Téléphone de contact').fill('+216 71 123 456');
      await page
        .getByLabel('Racontez votre voiture')
        .fill(
          'Annonce de vérification du parcours complet. Entretien documenté et véhicule de test.',
        );
      await page.getByRole('button', { name: 'Continuer', exact: true }).click();
      await page.locator('#car-photos').setInputFiles(resolve('tests/fixtures/listing.png'));
      await expect(page.getByAltText('Photo de votre annonce')).toBeVisible();
      await page.locator('#car-glb').setInputFiles(resolve('../carnova-back/models/bmw.glb'));
      await expect(page.getByText('Modèle 3D ajouté', { exact: false })).toBeVisible();
      await page.getByRole('button', { name: 'Continuer', exact: true }).click();
      await page.getByRole('button', { name: 'Simuler le paiement de 5 €' }).click();
      await expect(page.getByText('Paiement test confirmé', { exact: false })).toBeVisible();
      await page.getByRole('button', { name: 'Publier mon annonce', exact: true }).click();
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
      await capture('published-listing');
      await page.getByRole('button', { name: 'Enregistrer', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Enregistrée', exact: true })).toBeVisible();
      await page.goto('/annonces');
      await page.getByRole('textbox', { name: 'Rechercher une voiture', exact: true }).fill(title);
      await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
      await expect(page).toHaveURL((url) => url.searchParams.get('q') === title);
      await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
      await capture('search');
      await page.getByRole('button', { name: /Ouvrir l’assistant CarNova/ }).click();
      await expect(page.getByRole('dialog', { name: 'Votre copilote CarNova' })).toBeVisible();
      await page.getByLabel('Votre question').fill('Quels documents vérifier ?');
      await page.getByRole('button', { name: 'Envoyer le message' }).click();
      await expect(page.locator('.chat-message.bot').last()).toContainText('carte grise');
      await page.getByRole('button', { name: 'Fermer l’assistant' }).click();
      await page.goto('/espace');
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
      await page.getByRole('combobox', { name: 'Statut de ' + title }).selectOption('RESERVE');
      await expect(
        page.getByRole('status').filter({ hasText: 'Statut de l’annonce mis à jour.' }),
      ).toBeVisible();
      await page.getByRole('button', { name: /Mes favoris/ }).click();
      await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
      await page.goto('/espace/creer-showroom');
      await page.getByLabel('Nom du showroom').fill('Collection du parcours');
      await page.getByLabel('Ville & adresse').fill('Tunis');
      await page.getByLabel('Téléphone *', { exact: true }).fill('+216 71 123 456');
      await page
        .getByLabel('Votre histoire')
        .fill('Une collection créée pour vérifier le parcours showroom de CarNova.');
      await page.getByRole('button', { name: 'Une voiture', exact: true }).click();
      await page.getByLabel('Marque *', { exact: true }).fill('BMW');
      await page.getByLabel('Modèle *', { exact: true }).fill('320i');
      await page.getByLabel('Prix (TND)').fill('123456');
      await page.getByRole('button', { name: 'Ouvrir mon showroom' }).click();
      await expect(
        page.getByRole('heading', { name: 'Collection du parcours', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('cell', { name: 'BMW 320i', exact: true })).toBeVisible();
      await page.goto('/espace');
      await page.getByRole('button', { name: /Mes showrooms/ }).click();
      await page.getByRole('link', { name: 'Modifier', exact: true }).click();
      await page.getByLabel('Nom du showroom').fill('Collection mise à jour');
      await page.getByRole('button', { name: 'Enregistrer les changements', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Collection mise à jour', exact: true }),
      ).toBeVisible();
      await page.goto('/espace');
      await page.getByRole('button', { name: 'Supprimer ' + title, exact: true }).click();
      await page.getByRole('button', { name: 'Confirmer la suppression', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Votre première annonce ?' })).toBeVisible();
      expect(errors).toEqual([]);
    });
  });
}

test('3D model loads, orbit controls work and driving is available', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/studio');
  await expect(page.locator('.viewer canvas')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lancer la rotation' })).toBeVisible({
    timeout: 60000,
  });
  await page.getByRole('button', { name: 'Lancer la rotation' }).click();
  await expect(page.getByRole('button', { name: 'Arrêter la rotation' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Réinitialiser la vue' }).click();
  await page.getByRole('button', { name: 'Peinture bleu nuit' }).click();
  await page.getByRole('link', { name: 'Conduire', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Accélérer' })).toBeVisible({ timeout: 60000 });
  await page.locator('.viewer canvas').focus();
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(700);
  await page.keyboard.up('ArrowUp');
  await expect(page.locator('.speed-display')).not.toHaveText('0 km/h');
  expect(errors).toEqual([]);
});

test('contact, responsive navigation, theme persistence and guarded admin work', async ({
  page,
}) => {
  await page.goto('/contact');
  await page.getByLabel('Votre nom', { exact: true }).fill('Visiteur Test');
  await page.getByLabel('Votre adresse e-mail', { exact: true }).fill('visitor@example.com');
  await page
    .getByLabel('Votre message', { exact: true })
    .fill('Bonjour, message de vérification du formulaire CarNova.');
  await page.getByRole('button', { name: 'Envoyer mon message' }).click();
  await expect(page.getByRole('heading', { name: 'Message bien arrivé.' })).toBeVisible();
  await page.goto('/admin');
  await expect(page).toHaveURL(/login/);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'Ouvrir le menu', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Navigation mobile' })
    .getByRole('link', { name: 'Studio 3D' })
    .click();
  await expect(page).toHaveURL(/studio/);
  await page.goto('/');
  const theme = await page.locator('html').getAttribute('data-theme');
  await page.locator('.theme-button').click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute(
    'data-theme',
    theme === 'dark' ? 'light' : 'dark',
  );
});

test('3D failure provides an accessible fallback', async ({ page }) => {
  await page.route('**/api/models/*.glb', (route) => route.abort());
  await page.goto('/studio');
  await expect(page.getByRole('button', { name: 'Réessayer la 3D' })).toBeVisible();
  await expect(page.getByAltText('Aperçu automobile en deux dimensions')).toBeVisible();
});

test.afterEach(async ({ page, request }) => {
  // Only remove content created by this suite's synthetic account; retain accounts/media.
  const session = await page
    .evaluate(() => JSON.parse(sessionStorage.getItem('carnova-session') ?? 'null'))
    .catch(() => null);
  if (!session?.email?.startsWith('browser-') || !session.email.endsWith('@example.com')) return;
  const headers = { Authorization: 'Bearer ' + session.token };
  const cars = await request.get('/api/annonces/my-annonces', { headers });
  if (cars.ok())
    for (const car of await cars.json())
      if (car.titre.startsWith('BMW parcours '))
        await request.delete('/api/annonces/' + car.id, { headers });
  const showrooms = await request.get('/api/showrooms/me', { headers });
  if (showrooms.ok())
    for (const showroom of await showrooms.json())
      if (['Collection du parcours', 'Collection mise à jour'].includes(showroom.nom))
        await request.delete('/api/showrooms/' + showroom.id, { headers });
});

test('admin publishes and removes an original Journal article', async ({ page, request }) => {
  await adminSession(page, request);
  const title = 'Journal de vérification ' + Date.now();
  await page.goto('/admin');
  await page.getByLabel('Titre', { exact: true }).fill(title);
  await page
    .getByLabel('Texte éditorial')
    .fill('Un article original créé pour vérifier le parcours éditorial du portfolio CarNova.');
  await page.getByRole('button', { name: 'Publier l’article', exact: true }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await page.goto('/actualites');
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  await page.goto('/admin');
  await page.getByRole('button', { name: 'Supprimer l’article ' + title, exact: true }).click();
  await page.getByRole('button', { name: 'Confirmer la suppression', exact: true }).click();
  await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
});
