import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

const test = testFactory(import.meta.url, { root: './fixtures/vite-virtual-modules/' });
const VIRTUAL_MODULE_ID = '/@id/__x00__virtual:dynamic.css';

let devServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

/**
 *
 * @param {import("@playwright/test").Page} page
 * @param {string} element
 * @param {string} attribute
 * @returns {Promise<import("@playwright/test").Locator>}
 */
async function getElemForVirtual(page, element, attribute) {
	const elements = await page.locator(element).all();

	for (const elem of elements) {
		const attr = await elem.getAttribute(attribute);

		if (attr !== VIRTUAL_MODULE_ID) continue;

		return elem;
	}
}

test.describe('Vite Virtual Modules', () => {
	test('contains style tag with virtual module id', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const style = await getElemForVirtual(page, 'style', 'data-vite-dev-id');

		expect(style).not.toBeUndefined();
	});

	test('contains script tag with virtual module id', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const script = await getElemForVirtual(page, 'script', 'src');

		expect(script).not.toBeUndefined();
	});
});
