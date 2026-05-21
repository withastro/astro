import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Locator, type Page, expect, test as testBase } from '@playwright/test';
import type { AstroLogger } from '../dist/core/logger/core.js';
import {
	type AstroInlineConfig,
	type DevServer,
	type Fixture,
	type PreviewServer,
	loadFixture as baseLoadFixture,
} from '../test/test-utils.ts';

export type { AstroInlineConfig, DevServer, Fixture, PreviewServer };

// Get all test files in directory, assign unique port for each of them so they don't conflict
const testFiles = await fs.readdir(new URL('.', import.meta.url));
const testFileToPort = new Map<string, number>();
for (let i = 0; i < testFiles.length; i++) {
	const file = testFiles[i];
	if (file.endsWith('.test.ts')) {
		// Port 4045 is an unsafe port in Chrome, so skip it.
		if (4000 + i === 4045) {
			i++;
		}
		testFileToPort.set(file, 4000 + i);
	}
}

export function loadFixture(testFile: string, inlineConfig: AstroInlineConfig): Promise<Fixture> {
	if (!inlineConfig?.root) throw new Error("Must provide { root: './fixtures/...' }");

	const port = testFileToPort.get(path.basename(testFile));

	// resolve the relative root (i.e. "./fixtures/tailwindcss") to a full filepath
	// without this, the main `loadFixture` helper will resolve relative to `packages/astro/test`
	return baseLoadFixture({
		...inlineConfig,
		root: fileURLToPath(new URL(inlineConfig.root as string, import.meta.url)),
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

export function testFactory(testFile: string, inlineConfig: AstroInlineConfig) {
	let fixture: Fixture;

	const test = testBase.extend<{ astro: Fixture }>({
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

export type AstroTest = ReturnType<typeof testFactory>;

export async function getErrorOverlayContent(page: Page) {
	const overlay = await page.waitForSelector('vite-error-overlay', {
		strict: true,
		timeout: 10 * 1000,
	});

	expect(overlay).toBeTruthy();

	const message = await overlay.$$eval('#message-content', (m) => m[0].textContent);
	const hint = await overlay.$$eval('#hint-content', (m) => m[0].textContent);
	const [absoluteFileLocation, fileLocation] = await overlay.$$eval('#code header h2', (m) => [
		(m[0] as HTMLElement).title,
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

type LogEntry = { label: string; message: unknown };
type LoggerSpyOptions = {
	info?: LogEntry[];
	warn?: LogEntry[];
	error?: LogEntry[];
	debug?: LogEntry[];
};

/**
 * Create a spy logger that captures log messages into provided arrays
 */
export function createLoggerSpy(options: LoggerSpyOptions = {}): AstroLogger {
	const infoLogs = options.info || [];
	const warnLogs = options.warn || [];
	const errorLogs = options.error || [];
	const debugLogs = options.debug || [];

	const logger = {
		info(label: string, message: unknown) {
			infoLogs.push({ label, message });
		},
		warn(label: string, message: unknown) {
			warnLogs.push({ label, message });
		},
		error(label: string, message: unknown) {
			errorLogs.push({ label, message });
		},
		debug(label: string, ...messages: unknown[]) {
			debugLogs.push(...messages.map((message) => ({ label, message })));
		},
		options: {
			destination: { write: () => true },
			level: 'info',
		},
		level: () => 'info',
		forkIntegrationLogger(label: string) {
			const forked = {
				info: (message: unknown) => infoLogs.push({ label, message }),
				warn: (message: unknown) => warnLogs.push({ label, message }),
				error: (message: unknown) => errorLogs.push({ label, message }),
				debug: (message: unknown) => debugLogs.push({ label, message }),
				fork: (_newLabel: string) => {
					return forked;
				},
			};
			return forked;
		},
	};

	// @ts-expect-error: TODO: use a real AstroLogger instance instead of this mock
	return logger as AstroLogger;
}
