import { test as testBase, expect } from '@playwright/test';
import { loadFixture as baseLoadFixture } from '../test/test-utils.js';

export function loadFixture(inlineConfig) {
	if (!inlineConfig || !inlineConfig.root)
		throw new Error("Must provide { root: './fixtures/...' }");

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: new URL(inlineConfig.root, import.meta.url).toString(),
	});
}

export function testFactory(inlineConfig) {
	let fixture;

	const test = testBase.extend({
		astro: async ({}, use) => {
			fixture = await loadFixture(inlineConfig);
			await use(fixture);
		},
	});

	test.afterEach(() => {
		fixture.resetAllFiles();
	});

	return test;
}

export async function getErrorOverlayMessage(page) {
	const overlay = await page.waitForSelector('vite-error-overlay', { strict: true, timeout: 10 * 1000 })
	
	expect(overlay).toBeTruthy()
	
	return await overlay.$$eval('.message-body', (m) => m[0].textContent)
}
