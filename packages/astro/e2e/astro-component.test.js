import { test as base, expect } from '@playwright/test';
import { loadFixture } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/astro-component/' });
		await use(fixture);
	},
});

let devServer;

test.beforeEach(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterEach(async () => {
	await devServer.stop();
});

test.describe('Astro component HMR', () => {
	test('component styles', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const hero = page.locator('section');
		await expect(hero, 'hero has background: white').toHaveCSS(
			'background-color',
			'rgb(255, 255, 255)'
		);
		await expect(hero, 'hero has color: black').toHaveCSS('color', 'rgb(0, 0, 0)');

		// Edit the Hero component with a new background color
		await astro.editFile('./src/components/Hero.astro', (content) =>
			content.replace('background: white', 'background: rgb(230, 230, 230)')
		);

		await expect(hero, 'background color updated').toHaveCSS(
			'background-color',
			'rgb(230, 230, 230)'
		);
	});

	test('hoisted scripts', async ({ page, astro }) => {
		// Track all console logs to verify the hoisted script runs
		let logs = [];
		page.on('console', (message) => {
			logs.push(message.text());	
		});
		
		await page.goto(astro.resolveUrl('/'));

		await expect(logs.includes('Hello, Astro!')).toBeTruthy();

		// Edit the hoisted script on the page
		await astro.editFile('./src/pages/index.astro', (content) =>
			content.replace('Hello, Astro!', 'Hello, updated Astro!')
		);

		// Updating the astro component will trigger a full reload,
		// wait for the page to navigate back to /
		await page.waitForNavigation({ url: astro.resolveUrl('/') });

		await expect(logs.includes('Hello, updated Astro!')).toBeTruthy();
	});
});
