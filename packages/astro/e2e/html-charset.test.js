import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory({ root: './fixtures/html-page/', output: 'server' });

let devServer;

test.beforeAll(async ({ astro }) => {
  devServer = await astro.startDevServer();
});

test.afterAll(async () => {
  await devServer.stop();
});

test.describe('static content', () => {
  test('Parse static content', async ({ astro, page }) => {
    await page.goto('/');

    const text = await page.locator('#text');
    await expect(text, 'parse the charset correctly').toHaveText('Astro🚀');
  });
})

test.describe('streaming content', () => {
  test('Parse streaming content', async ({ astro, page }) => {
    await page.goto('/streaming');

    const text = await page.locator('#text');
    await expect(text, 'parse the charset correctly').toHaveText('Astro🚀');
  });
})