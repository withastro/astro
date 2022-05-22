import { test as base, expect } from '@playwright/test';
import { loadFixture } from './test-utils.js';

const test = base.extend({
	astro: async ({}, use) => {
		const fixture = await loadFixture({ root: './fixtures/tailwindcss/' });
		await use(fixture);
	},
});

let devServer;

test.beforeEach(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterEach(async ({ astro }) => {
	await devServer.stop();
	astro.resetAllFiles();
});

test.describe('Tailwind CSS', () => {
	test('body', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const body = page.locator('body');

		await expect(body, 'should have classes').toHaveClass('bg-dawn text-midnight');
		await expect(body, 'should have background color').toHaveCSS(
			'background-color',
			'rgb(243, 233, 250)'
		);
		await expect(body, 'should have color').toHaveCSS('color', 'rgb(49, 39, 74)');
	});

	test('button', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const button = page.locator('button');

		await expect(button, 'should have bg-purple-600').toHaveClass(/bg-purple-600/);
		await expect(button, 'should have background color').toHaveCSS(
			'background-color',
			'rgb(147, 51, 234)'
		);

		await expect(button, 'should have lg:py-3').toHaveClass(/lg:py-3/);
		await expect(button, 'should have padding bottom').toHaveCSS('padding-bottom', '12px');
		await expect(button, 'should have padding top').toHaveCSS('padding-top', '12px');

		await expect(button, 'should have font-[900]').toHaveClass(/font-\[900\]/);
		await expect(button, 'should have font weight').toHaveCSS('font-weight', '900');
	});

	test('HMR', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		await astro.editFile('./src/components/Button.astro', (original) =>
			original.replace('bg-purple-600', 'bg-purple-400')
		);

		const button = page.locator('button');

		await expect(button, 'should have bg-purple-400').toHaveClass(/bg-purple-400/);
		await expect(button, 'should have background color').toHaveCSS(
			'background-color',
			'rgb(192, 132, 252)'
		);
	});
});
