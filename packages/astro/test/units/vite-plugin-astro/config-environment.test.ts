import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type * as vite from 'vite';
import { defaultClientConditions } from 'vite';
import astro from '../../../dist/vite-plugin-astro/index.js';
import { createBasicSettings, defaultLogger } from '../test-utils.ts';

function getConfigEnvironmentHook(plugins: vite.Plugin[]) {
	const plugin = plugins.find((p) => p.name === 'astro:build');
	const hook = plugin?.configEnvironment;
	return typeof hook === 'function' ? hook : hook?.handler;
}

describe('vite-plugin-astro configEnvironment', () => {
	it('adds the `astro` resolve condition exactly once across repeated calls', async () => {
		const settings = await createBasicSettings();
		const configEnvironment = getConfigEnvironmentHook(astro({ settings, logger: defaultLogger }));
		assert.equal(typeof configEnvironment, 'function');

		// On dev server restart, `configEnvironment` runs again and the resolved
		// `resolve.conditions` array carries over. Calling it twice on the same
		// config must not duplicate the `astro` condition, otherwise the
		// environment's optimizeDeps config hash changes and forces a spurious
		// dependency re-optimization.
		const viteConfig: vite.EnvironmentOptions & { consumer?: string } = {
			consumer: 'client',
			resolve: {},
		};
		await configEnvironment!.call({} as any, 'client', viteConfig as any, {} as any);
		await configEnvironment!.call({} as any, 'client', viteConfig as any, {} as any);

		assert.deepEqual(viteConfig.resolve!.conditions, [...defaultClientConditions, 'astro']);
	});
});
