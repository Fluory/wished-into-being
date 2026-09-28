import { expect, test } from '@playwright/test';

test.describe('smoke', () => {
  test('home tells the story and links to the island', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Wished');
    await expect(page.getByRole('complementary', { name: 'Tonight on the island' })).toBeVisible();
    await page.getByRole('link', { name: /Walk the island/ }).click();
    await expect(page).toHaveURL(/\/map$/);
    await expect(page.getByRole('slider', { name: 'Day' })).toBeVisible();
  });

  test('every wish button leads to the issue form', async ({ page }) => {
    await page.goto('/');
    const wish = page.getByRole('link', { name: /Make a wish/ }).first();
    await expect(wish).toHaveAttribute('href', /\/issues\/new\?template=wish\.yml$/);
  });

  test('the gallery filters by kind', async ({ page }) => {
    await page.goto('/wishes');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Everything here');
    await page.getByRole('button', { name: /Objects/ }).click();
    await expect(page.getByRole('link', { name: /The wishing well/ })).toBeVisible();
  });

  test('logbook lists day 0 and opens its page', async ({ page }) => {
    await page.goto('/logbook');
    await page
      .getByRole('link', { name: /A wishing well on a small island/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/day\/0$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('A wishing well on a small island');
  });

  test('chapters render MDX', async ({ page }) => {
    await page.goto('/chapters/sixteen-colours');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sixteen by sixteen, fifteen colours');
    await expect(page.getByRole('heading', { level: 2, name: 'The palette' })).toBeVisible();
  });

  test('legal pages exist', async ({ page }) => {
    await page.goto('/impressum');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Impressum');
    await page.goto('/datenschutz');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Datenschutzerklärung');
  });
});
