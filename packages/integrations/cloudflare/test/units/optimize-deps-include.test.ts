import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AstroIntegration, HookParameters } from 'astro';
import createIntegration from '../../dist/index.js';

type UpdateConfigParam = Parameters<HookParameters<'astro:config:setup'>['updateConfig']>[0];

/**
 * Runs the adapter's `astro:config:setup` hook with the minimal stubs it
 * reads, capturing the Vite config it pushes through `updateConfig`.
 */
async function runConfigSetup(integration: AstroIntegration) {
	let updatedConfig: any;
	await integration.hooks['astro:config:setup']!({
		command: 'dev',
		config: {
			root: new URL('./fixtures/user-optimize-deps/', import.meta.url),
			srcDir: new URL('./fixtures/user-optimize-deps/src/', import.meta.url),
			session: false,
			cache: {},
			logger: {},
			vite: {},
			experimental: {},
		} as any,
		updateConfig(newConfig: UpdateConfigParam) {
			updatedConfig = newConfig;
			return newConfig;
		},
		logger: { info() {}, warn() {}, error() {} },
		addWatchFile() {},
	} as unknown as HookParameters<'astro:config:setup'>);

	assert.ok(updatedConfig, 'updateConfig should have been called');
	return updatedConfig;
}

describe('@astrojs/cloudflare optimizeDeps includes', () => {
	it('pre-includes astro/logger/console for server environments', async () => {
		const integration = createIntegration();
		const updatedConfig = await runConfigSetup(integration);

		const plugins = updatedConfig.vite.plugins as any[];
		const environmentPlugin = plugins.find(
			(plugin) => plugin.name === '@astrojs/cloudflare:environment',
		);
		assert.ok(environmentPlugin, 'expected an @astrojs/cloudflare:environment plugin');

		// `astro:assets`' runtime logger setup always imports the console logger on
		// the server, so every server environment must pre-bundle it during the
		// initial optimization pass (a mid-request discovery would re-optimize the
		// dependency cache while workerd still references the old chunks).
		for (const environmentName of ['astro', 'ssr', 'prerender']) {
			const result = environmentPlugin.configEnvironment(environmentName, {
				optimizeDeps: { noDiscovery: false },
			});
			const include = result?.optimizeDeps?.include ?? [];
			assert.ok(
				Array.isArray(include) && include.includes('astro/logger/console'),
				`${environmentName} should pre-include astro/logger/console, got: ${JSON.stringify(include)}`,
			);
		}
	});
});
