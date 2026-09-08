import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type * as vite from 'vite';
import { vitePluginEnvironment } from '../../../dist/vite-plugin-environment/index.js';
import { createBasicSettings } from '../test-utils.ts';

function getConfigEnvironmentHook(plugin: vite.Plugin) {
	const hook = plugin.configEnvironment;
	return typeof hook === 'function' ? hook : hook?.handler;
}

describe('vite-plugin-environment server entries', () => {
	it('includes renderer server entrypoints in optimizeDeps.include for server environments', async () => {
		const settings = await createBasicSettings();
		// Mirror what integrations register through `addRenderer`: string
		// entrypoints (`@astrojs/svelte`) and URL entrypoints.
		settings.renderers = [
			{
				name: '@astrojs/svelte',
				clientEntrypoint: '@astrojs/svelte/client.js',
				serverEntrypoint: '@astrojs/svelte/server.js',
			},
			{
				name: '@astrojs/react',
				clientEntrypoint: '@astrojs/react/client.js',
				serverEntrypoint: new URL('file:///tmp/react-server.js'),
			},
		];

		const plugin = vitePluginEnvironment({
			command: 'dev',
			settings,
			astroPkgsConfig: {
				optimizeDeps: { include: [], exclude: [] },
				ssr: { noExternal: [], external: [] },
			},
		});
		const configEnvironment = getConfigEnvironmentHook(plugin);
		assert.ok(configEnvironment, 'configEnvironment hook should exist');

		for (const environmentName of ['ssr', 'astro', 'prerender']) {
			const result = await configEnvironment!.call(
				{} as any,
				environmentName,
				{ optimizeDeps: { noDiscovery: false } } as any,
				{} as any,
			);
			const include = (result as vite.EnvironmentOptions)?.optimizeDeps?.include;
			assert.ok(Array.isArray(include), `${environmentName} should have optimizeDeps.include`);
			assert.ok(
				include!.includes('@astrojs/svelte/server.js'),
				`${environmentName} should pre-include the svelte server entrypoint, got: ${include}`,
			);
			assert.ok(
				include!.includes('/tmp/react-server.js'),
				`${environmentName} should pre-include URL server entrypoints, got: ${include}`,
			);
		}
	});

	it('does not include renderer server entrypoints for the client environment', async () => {
		const settings = await createBasicSettings();
		settings.renderers = [
			{
				name: '@astrojs/svelte',
				clientEntrypoint: '@astrojs/svelte/client.js',
				serverEntrypoint: '@astrojs/svelte/server.js',
			},
		];

		const plugin = vitePluginEnvironment({
			command: 'dev',
			settings,
			astroPkgsConfig: {
				optimizeDeps: { include: [], exclude: [] },
				ssr: { noExternal: [], external: [] },
			},
		});
		const configEnvironment = getConfigEnvironmentHook(plugin);
		assert.ok(configEnvironment, 'configEnvironment hook should exist');

		const result = await configEnvironment!.call({} as any, 'client', {} as any, {} as any);
		const include = (result as vite.EnvironmentOptions)?.optimizeDeps?.include;
		assert.ok(Array.isArray(include), 'client environment should have optimizeDeps.include');
		assert.ok(
			!include!.includes('@astrojs/svelte/server.js'),
			`client environment should not pre-include server entrypoints, got: ${include}`,
		);
	});

	it('keeps the scan entries when appending renderer server entrypoints (noDiscovery: false)', async () => {
		// `noDiscovery: false` (set by adapters like @astrojs/cloudflare) makes the
		// plugin replace the optimizer options; the renderer entries must be
		// appended to that replacement, not to the object it discards.
		const settings = await createBasicSettings();
		settings.renderers = [
			{
				name: '@astrojs/svelte',
				clientEntrypoint: '@astrojs/svelte/client.js',
				serverEntrypoint: '@astrojs/svelte/server.js',
			},
			{
				name: '@astrojs/react',
				clientEntrypoint: '@astrojs/react/client.js',
				serverEntrypoint: '@astrojs/react/server.js',
			},
			{
				name: '@astrojs/preact',
				clientEntrypoint: '@astrojs/preact/client.js',
				serverEntrypoint: new URL('file:///tmp/preact-server.js'),
			},
		];

		const plugin = vitePluginEnvironment({
			command: 'dev',
			settings,
			astroPkgsConfig: {
				optimizeDeps: { include: [], exclude: [] },
				ssr: { noExternal: [], external: [] },
			},
		});
		const configEnvironment = getConfigEnvironmentHook(plugin);
		assert.ok(configEnvironment, 'configEnvironment hook should exist');

		const result = await configEnvironment!.call(
			{} as any,
			'ssr',
			{ optimizeDeps: { noDiscovery: false } } as any,
			{} as any,
		);
		const optimizeDeps = (result as vite.EnvironmentOptions)?.optimizeDeps;
		assert.ok(optimizeDeps, 'ssr environment should have optimizeDeps');

		// The entries glob and node-fetch exclude from the noDiscovery branch must
		// survive; the renderer entries are appended to that same options object.
		assert.ok(
			Array.isArray(optimizeDeps.entries) && optimizeDeps.entries.length > 0,
			`noDiscovery branch should keep the scan entries, got: ${JSON.stringify(optimizeDeps.entries)}`,
		);
		assert.deepEqual(optimizeDeps.exclude, ['node-fetch']);

		const include = optimizeDeps.include;
		assert.ok(Array.isArray(include), 'ssr environment should have optimizeDeps.include');
		for (const entrypoint of [
			'@astrojs/svelte/server.js',
			'@astrojs/react/server.js',
			'/tmp/preact-server.js',
		]) {
			assert.ok(
				include!.includes(entrypoint),
				`ssr should include every renderer server entrypoint (missing ${entrypoint}), got: ${include}`,
			);
		}
	});
});
