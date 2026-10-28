import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import createVitePluginAstroServer from '../../../dist/vite-plugin-astro-server/plugin.js';
import { createBasicSettings } from '../test-utils.ts';
import { defaultLogger } from '../test-utils.ts';

describe('astro:server configureServer vitest guard', () => {
	const originalVitest = process.env.VITEST;

	afterEach(() => {
		if (originalVitest !== undefined) {
			process.env.VITEST = originalVitest;
		} else {
			delete process.env.VITEST;
		}
	});

	it('skips server setup when process.env.VITEST is set', async () => {
		process.env.VITEST = 'true';
		const settings = await createBasicSettings({});
		const plugin = createVitePluginAstroServer({ settings, logger: defaultLogger });

		// configureServer should return early without throwing when VITEST is set,
		// even with a fake viteServer that has no environments
		const fakeViteServer = {} as any;
		const result = await (plugin as any).configureServer(fakeViteServer);

		// Early return produces undefined (no middleware callback)
		assert.equal(result, undefined);
	});

	it('attempts server setup when process.env.VITEST is not set', async () => {
		delete process.env.VITEST;
		const settings = await createBasicSettings({});
		const plugin = createVitePluginAstroServer({ settings, logger: defaultLogger });

		// Without VITEST, configureServer should try to access viteServer.environments
		// and fail because our fake server has none
		const fakeViteServer = { environments: {} } as any;
		// Should not throw — it will just have no runnable environments
		const result = await (plugin as any).configureServer(fakeViteServer);

		// When there are no runnable environments, it returns a middleware setup function
		assert.equal(typeof result, 'function');
	});
});
