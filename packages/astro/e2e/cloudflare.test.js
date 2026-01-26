import { expect } from '@playwright/test';
import { testFactory, createLoggerSpy } from './test-utils.js';

const test = testFactory(import.meta.url, {
	root: './fixtures/cloudflare/',
	devToolbar: {
		enabled: false,
	},
});

function sharedTests(testRunner, infoLogs = null) {
	testRunner('renders SSR index page', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const h1 = page.locator('#blog-posts');
		await expect(h1).toContainText('Blog Posts');
	});

	testRunner('content collections - getCollection()', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const dogsList = page.locator('#dogs-list');
		await expect(dogsList).toContainText('Labrador');
	});

	testRunner('content collections - getEntry()', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const firstTitle = page.locator('#first-blog-title');
		await expect(firstTitle).toBeVisible();
	});

	testRunner('content collections - render()', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const content = page.locator('#content');
		await expect(content).toBeVisible();
	});

	testRunner('react component with client:load', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expect(page.locator('#framework')).toContainText('Hello from React');
	});

	testRunner('vue component with client:load', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		await expect(page.locator('#framework')).toContainText('Hello from vue component');
	});

	testRunner('server island with server:defer', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const island = page.locator('#island');
		await expect(island).toContainText('Island time');
	});

	testRunner('server island with props', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const islandProps = page.locator('#island-props');
		await expect(islandProps).toContainText('Aria');
	});

	testRunner('url search params', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/?surname=Smith'));
		const islandProps = page.locator('#island-props');
		await expect(islandProps).toContainText('Smith');
	});

	testRunner('worker runtime detection', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const runtime = page.locator('#runtime');
		await expect(runtime).toContainText('Running on:');
	});

	testRunner('data collection mapping', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const dogsList = page.locator('#dogs-list');
		await expect(dogsList).toBeVisible();
		await expect(dogsList).toContainText('Dog');
	});

	testRunner('dynamic content rendering', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));
		const lastUpdated = page.locator('#last-updated');
		await expect(lastUpdated).toContainText('Last updated:');
	});

	// Dev-specific tests
	if (infoLogs) {
		testRunner('dev server logs', () => {
			const serverStartLog = infoLogs.find((log) => log.message && log.message.includes('Local'));
			expect(serverStartLog).toBeDefined();
		});

		testRunner('all dependencies pre-optimized, none discovered', () => {
			// Verify that all of Astro's dependencies are pre-optimized in the Vite cache
			// and that no new dependencies are discovered and optimized during dev server startup
			const optimizedLog = infoLogs.find(
				(log) => log.message && log.message.includes('new dependencies optimized'),
			);
			expect(optimizedLog).toBeUndefined();
		});
	}
}

test.describe('Cloudflare', () => {
	test.describe('Development', () => {
		let devServer;
		let infoLogs = [];

		test.beforeAll(async ({ astro }) => {
			const logger = createLoggerSpy({ info: infoLogs });
			devServer = await astro.startDevServer({ logger });
		});

		test.afterAll(async () => {
			await devServer.stop();
		});

		sharedTests(test, infoLogs);
	});

	test.describe('Production', () => {
		let previewServer;

		test.beforeAll(async ({ astro }) => {
			// Playwright's Node version doesn't have these functions, so stub them.
			process.stdout.clearLine = () => {};
			process.stdout.cursorTo = () => {};
			await astro.build();
			previewServer = await astro.preview();
		});

		test.afterAll(async () => {
			await previewServer.stop();
		});

		sharedTests(test);
	});
});
