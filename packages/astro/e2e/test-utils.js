import { default as globalTestFactory } from '../dist/testing/playwright-factory.js';
export { loadFixture, isWindows } from '../test/test-utils.js';

export function testFactory(/** @type {import('../dist/@types/astro.js').AstroConfig} */ astroConfig) {
	return globalTestFactory(astroConfig, true);
}

/**
 *
 * @param {string} page
 * @returns {Promise<{message: string, hint: string, absoluteFileLocation: string, fileLocation: string}>}
 */
export async function getErrorOverlayContent(page) {
	const overlay = await page.waitForSelector('vite-error-overlay', {
		strict: true,
		timeout: 10 * 1000,
	});

	expect(overlay).toBeTruthy();

	const message = await overlay.$$eval('#message-content', (m) => m[0].textContent);
	const hint = await overlay.$$eval('#hint-content', (m) => m[0].textContent);
	const [absoluteFileLocation, fileLocation] = await overlay.$$eval('#code header h2', (m) => [
		m[0].title,
		m[0].textContent,
	]);
	return { message, hint, absoluteFileLocation, fileLocation };
}

/**
 * @param {import('@playwright/test').Locator} el
 * @returns {Promise<string>}
 */
export async function getColor(el) {
	return await el.evaluate((e) => getComputedStyle(e).color);
}
