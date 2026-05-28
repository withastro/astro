import { type Locator, type Page, expect } from '@playwright/test';
import { type DevServer, testFactory } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/vite-virtual-modules/' });
const VIRTUAL_MODULE_ID = '/@id/__x00__virtual:dynamic.css';

let devServer: DevServer;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
});

test.afterAll(async () => {
	await devServer.stop();
});

async function getElemForVirtual(
	page: Page,
	element: string,
	attribute: string,
): Promise<Locator | undefined> {
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
