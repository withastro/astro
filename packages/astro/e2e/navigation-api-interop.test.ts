import { expect } from '@playwright/test';
import { type DevServer, testFactory, warmupDevServer } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/view-transitions/' });

let devServer: DevServer;

test.beforeAll(async ({ astro, browser }) => {
	devServer = await astro.startDevServer();
	await warmupDevServer(browser, astro.resolveUrl('/one'));
});

test.afterAll(async () => {
	await devServer.stop();
});

async function installExternalRouter(page: import('@playwright/test').Page) {
	await page.evaluate(() => {
		const navigation = (window as Window & { navigation: any }).navigation;
		navigation.addEventListener('navigate', (event: any) => {
			if (event.info?.externalRouter === true || event.navigationType === 'traverse') {
				event.intercept({ handler: async () => {} });
			}
		});
	});
}

async function expectNavigationApi(page: import('@playwright/test').Page) {
	const supported = await page.evaluate(
		() =>
			typeof (window as Window & { navigation?: unknown }).navigation === 'object' &&
			typeof (window as Window & { NavigationPrecommitController?: unknown })
				.NavigationPrecommitController === 'function',
	);
	if (!supported) test.skip();
}

async function startPreparationCounter(page: import('@playwright/test').Page) {
	await page.evaluate(() => {
		(window as Window & { astroPreparations?: number }).astroPreparations = 0;
		document.addEventListener('astro:before-preparation', () => {
			(window as Window & { astroPreparations?: number }).astroPreparations!++;
		});
	});
}

async function expectNoAstroPreparation(page: import('@playwright/test').Page) {
	expect(
		await page.evaluate(
			() => (window as Window & { astroPreparations?: number }).astroPreparations,
		),
	).toBe(0);
}

test('does not claim pushed entries owned by another Navigation API router', async ({
	page,
	astro,
}) => {
	await page.goto(astro.resolveUrl('/one'));
	await expectNavigationApi(page);
	await installExternalRouter(page);

	await page.evaluate(async () => {
		const navigation = (window as Window & { navigation: any }).navigation;
		await navigation.navigate('/one?external-router=1', {
			info: { externalRouter: true },
		}).finished;
	});
	await expect(page).toHaveURL(/\/one\?external-router=1$/);

	await startPreparationCounter(page);
	await page.evaluate(async () => {
		const navigation = (window as Window & { navigation: any }).navigation;
		await navigation.back().finished;
	});
	await expect(page).toHaveURL(/\/one$/);
	await expectNoAstroPreparation(page);
});

test('does not claim replaced entries owned by another Navigation API router', async ({
	page,
	astro,
}) => {
	await page.goto(astro.resolveUrl('/one'));
	await expectNavigationApi(page);

	await page.click('#click-two');
	await expect(page.locator('#two')).toHaveText('Page 2');
	await installExternalRouter(page);

	await page.evaluate(async () => {
		const navigation = (window as Window & { navigation: any }).navigation;
		await navigation.navigate('/two?external-router=replace', {
			history: 'replace',
			info: { externalRouter: true },
		}).finished;
	});
	await expect(page).toHaveURL(/\/two\?external-router=replace$/);

	await startPreparationCounter(page);
	await page.evaluate(async () => {
		const navigation = (window as Window & { navigation: any }).navigation;
		await navigation.back().finished;
	});
	await expect(page).toHaveURL(/\/one$/);
	await expectNoAstroPreparation(page);
});
