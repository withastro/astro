import { expect } from '@playwright/test';
import { type DevServer, testFactory } from './test-utils.ts';

const test = testFactory(import.meta.url, { root: './fixtures/react19-preact-hook-error/' });

function hookError() {
	const error = console.error;
	const errors: unknown[][] = [];
	console.error = function (...args) {
		errors.push(args);
	};
	return () => {
		console.error = error;
		return errors;
	};
}

let devServer: DevServer;
let unhook: () => unknown[][];

test.beforeAll(async ({ astro }) => {
	devServer = await astro.startDevServer();
	unhook = hookError();
});

test.afterAll(async () => {
	await devServer.stop();
});

// See: https://github.com/withastro/astro/issues/15341
test.describe('React v19 and preact hook issue', () => {
	test('should not have "Invalid hook call" errors', async ({ page, astro }) => {
		await page.goto(astro.resolveUrl('/'));

		const errors = unhook();
		const hasInvalidHookCallErrorLog = errors
			.flat()
			.some((log) => typeof log === 'string' && log.includes('Invalid hook call'));

		expect(hasInvalidHookCallErrorLog).toBe(false);
	});
});
