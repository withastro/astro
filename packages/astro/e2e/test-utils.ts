import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test as testBase, type Locator, type Page } from '@playwright/test';
import { loadFixture as baseLoadFixture, type Fixture } from '../test/test-utils.js';
import type { AstroInlineConfig } from '../dist/index.js';
import { AstroIntegrationLogger, type Logger } from '../dist/core/logger/core.js';

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

export function loadFixture(
	testFile: string,
	inlineConfig: AstroInlineConfig & { root?: string | URL },
) {
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

export function testFactory(
	testFile: string,
	inlineConfig: AstroInlineConfig & { root?: string | URL },
) {
	let fixture: Fixture;

	const test = testBase.extend<{ astro: Fixture }>({
		// biome-ignore lint/correctness/noEmptyPattern: playwright needs this
		astro: async ({}, use) => {
			fixture ??= await loadFixture(testFile, inlineConfig);
			await use(fixture);
		},
	});

	test.afterEach(() => {
		fixture.resetAllFiles();
	});

	return test;
}

export async function getErrorOverlayContent(page: Page) {
	const overlay = await page.waitForSelector('vite-error-overlay', {
		strict: true,
		timeout: 10 * 1000,
	});

	expect(overlay).toBeTruthy();

	const message = await overlay.$$eval('#message-content', (m) => m[0].textContent);
	const hint = await overlay.$$eval('#hint-content', (m) => m[0].textContent);
	const [absoluteFileLocation, fileLocation] = await overlay.$$eval('#code header h2', (m) => [
		// @ts-expect-error
		m[0].title,
		m[0].textContent,
	]);

	const codeFrame = await overlay.$('#code pre code');
	const copyButton = await overlay.$('#copy-btn');

	return { message, hint, absoluteFileLocation, fileLocation, codeFrame, copyButton };
}

/**
 * Wait for `astro-island` that contains the `el` to hydrate
 */
export async function waitForHydrate(page: Page, el: Locator) {
	const astroIsland = page.locator('astro-island', { has: el });
	const astroIslandId = await astroIsland.last().getAttribute('uid');
	await page.waitForFunction(
		(selector) => document.querySelector(selector)?.hasAttribute('ssr') === false,
		`astro-island[uid="${astroIslandId}"]`,
	);
}

/**
 * Scroll to element manually without making sure the `el` is stable
 */
export async function scrollToElement(el: Locator) {
	await el.evaluate((node) => {
		node.scrollIntoView({ behavior: 'auto' });
	});
}

/**
 * Create a spy logger that captures log messages into provided arrays
 */
export function createLoggerSpy(
	options: {
		info?: Array<{ label: string | null; message: string }>;
		warn?: Array<{ label: string | null; message: string }>;
		error?: Array<{ label: string | null; message: string }>;
		debug?: Array<{ label: string | null; message: string }>;
	} = {},
) {
	const infoLogs = options.info || [];
	const warnLogs = options.warn || [];
	const errorLogs = options.error || [];
	const debugLogs = options.debug || [];

	const logger: Logger = {
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
			dest: { write: () => true },
			level: 'info',
		},
		level: () => 'info',
		forkIntegrationLogger(label) {
			return new AstroIntegrationLogger(this.options, label);
		},
	};

	return logger;
}
