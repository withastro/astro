import { expect } from '@playwright/test';
import { testFactory } from './test-utils.js';

function hookConsoleLog() {
	// biome-ignore lint/suspicious/noConsole: allowed
	const log = console.log;
	const logs = [];
	console.log = function (...args) {
		logs.push(args);
	};
	return () => {
		console.log = log;
		return logs;
	};
}

const test = testFactory(import.meta.url, {
	root: './fixtures/astro-server-app-error-log/',
	devToolbar: {
		enabled: false,
	},
});

let devServer;
let unhook;

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
	unhook = hookConsoleLog();
});

test.afterAll(async () => {
	await devServer.stop();
});

test.describe('Astro page', () => {
	test('refresh with HMR', async ({ page, astro }) => {
		// 1. Load a page that imports a CSS file containing Tailwind (index.astro)
		await page.goto(astro.resolveUrl('/'));

		// 2. Edit a different page afterward
		await astro.editFile('./src/pages/test.astro', (original) =>
			original.replace('Original', 'Updated'),
		);

		// 3. Wait for Vite to reload via HMR
		await page.waitForNavigation({ waitUntil: 'load' });

		const logs = unhook();
		const hasFailedToLoadUrlLog = logs
			.flat()
			.some((log) => log.includes('Failed to load url') && log.includes('astro:server-app.js'));

		expect(hasFailedToLoadUrlLog).toBe(false);
	});
});
