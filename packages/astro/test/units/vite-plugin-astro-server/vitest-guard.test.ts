import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import createVitePluginAstroServer from '../../../dist/vite-plugin-astro-server/plugin.js';
import { createBasicSettings, defaultLogger } from '../test-utils.ts';

describe('vite-plugin-astro-server', () => {
	describe('configureServer VITEST guard', () => {
		let settings: Awaited<ReturnType<typeof createBasicSettings>>;

		before(async () => {
			settings = await createBasicSettings({});
		});

		it('skips server setup when process.env.VITEST is set', async () => {
			const plugin = createVitePluginAstroServer({ settings, logger: defaultLogger });
			const configureServer =
				typeof plugin.configureServer === 'function'
					? plugin.configureServer
					: (plugin.configureServer as { handler: Function }).handler;

			const originalVitest = process.env.VITEST;

			try {
				process.env.VITEST = 'true';

				// Create a minimal mock viteServer — configureServer should return
				// early before accessing any of its properties.
				const mockViteServer = {};

				// If configureServer does NOT return early, it will try to access
				// viteServer.environments which would throw on our empty mock.
				// A successful call (no throw, returns undefined) proves the guard works.
				const result = await configureServer.call({}, mockViteServer);
				assert.equal(result, undefined, 'configureServer should return undefined when VITEST is set');
			} finally {
				if (originalVitest === undefined) {
					delete process.env.VITEST;
				} else {
					process.env.VITEST = originalVitest;
				}
			}
		});

		it('proceeds with server setup when process.env.VITEST is not set', async () => {
			const plugin = createVitePluginAstroServer({ settings, logger: defaultLogger });
			const configureServer =
				typeof plugin.configureServer === 'function'
					? plugin.configureServer
					: (plugin.configureServer as { handler: Function }).handler;

			const originalVitest = process.env.VITEST;

			try {
				delete process.env.VITEST;

				// Create a minimal mock that will throw when the hook tries to access
				// environments, proving it did NOT return early.
				const mockViteServer = {};

				await assert.rejects(
					() => configureServer.call({}, mockViteServer),
					// It should fail trying to access properties on the mock server,
					// which proves configureServer didn't skip execution.
					(err: unknown) => err instanceof TypeError || err instanceof Error,
					'configureServer should proceed and fail on the mock when VITEST is not set',
				);
			} finally {
				if (originalVitest === undefined) {
					delete process.env.VITEST;
				} else {
					process.env.VITEST = originalVitest;
				}
			}
		});
	});
});
