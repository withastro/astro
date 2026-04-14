import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test as testBase } from '@playwright/test';
import { loadFixture as baseLoadFixture } from '../test/test-utils.js';

// Get all test files in directory, assign unique port for each of them so they don't conflict
const testFiles = await fs.readdir(new URL('.', import.meta.url));
const testFileToPort = new Map();
for (let i = 0; i < testFiles.length; i++) {
	const file = testFiles[i];
	if (file.endsWith('.test.js')) {
		// Port 4045 is an unsafe port in Chrome, so skip it.
		if (4000 + i === 4045) {
			i++;
		}
		testFileToPort.set(file, 4000 + i);
	}
}

export function loadFixture(testFile, inlineConfig) {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	const port = testFileToPort.get(path.basename(testFile));

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: fileURLToPath(new URL(inlineConfig.root, import.meta.url)),
		server: {
			...inlineConfig?.server,
			port,
		},
		vite: {
			...inlineConfig?.vite,
			server: {
				...inlineConfig?.vite?.server,
				strictPort: true,
			},
		},
	});
}

export function testFactory(testFile, inlineConfig) {
	let fixture;

	const test = testBase.extend({
		// biome-ignore lint/correctness/noEmptyPattern: playwright needs this
		astro: async ({}, use) => {
			fixture = fixture || (await loadFixture(testFile, inlineConfig));
			await use(fixture);
		},
	});

	test.afterEach(() => {
		fixture.resetAllFiles();
	});

	return test;
}

/**
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{message: string, hint: string, absoluteFileLocation: string, fileLocation: string, codeFrame: import('@playwright/test').ElementHandle, copyButton: import('@playwright/test').ElementHandle}>}
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

	const codeFrame = await overlay.$('#code pre code');
	const copyButton = await overlay.$('#copy-btn');

	return { message, hint, absoluteFileLocation, fileLocation, codeFrame, copyButton };
}

/**
 * Wait for `astro-island` that contains the `el` to hydrate
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} el
 */
export async function waitForHydrate(page, el) {
	const astroIsland = page.locator('astro-island', { has: el });
	const astroIslandId = await astroIsland.last().getAttribute('uid');
	await page.waitForFunction(
		(selector) => document.querySelector(selector)?.hasAttribute('ssr') === false,
		`astro-island[uid="${astroIslandId}"]`,
	);
}

/**
 * Warm up the dev server by visiting a page in a real browser context and waiting
 * for hydration. This triggers Vite's dep optimizer so that subsequent test page
 * loads don't cause unexpected full-page reloads from re-optimization.
 * @param {import('@playwright/test').Browser} browser
 * @param {string} url - The full URL to visit for warmup
 */
export async function warmupDevServer(browser, url) {
	const page = await browser.newPage();
	await page.goto(url, { waitUntil: 'load' });
	// Wait for potential dep re-optimization reload to settle, then wait for
	// all astro-islands to hydrate so client modules are fully loaded.
	await page.waitForLoadState('networkidle').catch(() => {});
	// Wait for each island to hydrate with a short timeout per island.
	// Some islands may not hydrate (e.g., if their framework has issues),
	// so we catch and continue.
	const islands = page.locator('astro-island');
	const count = await islands.count();
	for (let i = 0; i < count; i++) {
		const island = islands.nth(i);
		const uid = await island.getAttribute('uid').catch(() => null);
		if (uid) {
			await page
				.waitForFunction(
					(selector) => document.querySelector(selector)?.hasAttribute('ssr') === false,
					`astro-island[uid="${uid}"]`,
					{ timeout: 5_000 },
				)
				.catch(() => {});
		}
	}
	await page.close();
}

/**
 * Scroll to element manually without making sure the `el` is stable
 * @param {import('@playwright/test').Locator} el
 */
export async function scrollToElement(el) {
	await el.evaluate((node) => {
		node.scrollIntoView({ behavior: 'auto' });
	});
}

/**
 * Create a spy logger that captures log messages into provided arrays
 * @param {{info?: Array, warn?: Array, error?: Array, debug?: Array}} options - Optional arrays to push messages into
 * @returns {import('../dist/core/logger/core').AstroLogger}
 */
export function createLoggerSpy(options = {}) {
	const infoLogs = options.info || [];
	const warnLogs = options.warn || [];
	const errorLogs = options.error || [];
	const debugLogs = options.debug || [];

	const logger = {
		info(label, message) {
			infoLogs.push({ label, message });
		},
		warn(label, message) {
			warnLogs.push({ label, message });
		},
		error(label, message) {
			errorLogs.push({ label, message });
		},
		debug(label, ...messages) {
			debugLogs.push(...messages.map((message) => ({ label, message })));
		},
		options: {
			destination: { write: () => true },
			level: 'info',
		},
		level: () => 'info',
		forkIntegrationLogger(label) {
			const forked = {
				info: (message) => infoLogs.push({ label, message }),
				warn: (message) => warnLogs.push({ label, message }),
				error: (message) => errorLogs.push({ label, message }),
				debug: (message) => debugLogs.push({ label, message }),
				fork: (_newLabel) => {
					return forked;
				},
			};
			return forked;
		},
	};

	return logger;
}
