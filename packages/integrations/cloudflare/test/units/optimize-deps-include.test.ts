import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration, HookParameters } from 'astro';
import createIntegration from '../../dist/index.js';

type UpdateConfigParam = Parameters<HookParameters<'astro:config:setup'>['updateConfig']>[0];

// A real absolute file URL, valid on every platform (a Unix `/tmp/...` URL
// would make the adapter's `fileURLToPath` throw on Windows).
const reactServerURL = new URL('./react-server.js', import.meta.url);
const reactServerPath = fileURLToPath(reactServerURL);

const stubConfig = {
	root: new URL('./fixtures/user-optimize-deps/', import.meta.url),
	srcDir: new URL('./fixtures/user-optimize-deps/src/', import.meta.url),
	session: false,
	cache: {},
	logger: {},
	vite: {},
	experimental: {},
} as any;

const stubLogger = { info() {}, warn() {}, error() {} };

/**
 * Runs the adapter's `astro:config:setup` hook with the minimal stubs it
 * reads, capturing the Vite config it pushes through `updateConfig`.
 */
async function runConfigSetup(integration: AstroIntegration) {
	let updatedConfig: any;
	await integration.hooks['astro:config:setup']!({
		command: 'dev',
		config: stubConfig,
		updateConfig(newConfig: UpdateConfigParam) {
			updatedConfig = newConfig;
			return newConfig;
		},
		logger: stubLogger,
		addWatchFile() {},
	} as unknown as HookParameters<'astro:config:setup'>);

	assert.ok(updatedConfig, 'updateConfig should have been called');
	return updatedConfig;
}

/**
 * Runs `astro:config:done`, which is where the adapter captures the renderer
 * server entrypoints that its `configEnvironment` plugin then pre-includes.
 */
async function runConfigDone(integration: AstroIntegration, renderers: any[]) {
	await integration.hooks['astro:config:done']!({
		config: {
			...stubConfig,
			base: '/',
			build: { client: new URL('./dist/client/', stubConfig.root) },
			image: {},
		},
		renderers,
		setAdapter() {},
		injectTypes() {
			return new URL('file:///tmp/types.d.ts');
		},
		logger: stubLogger,
		buildOutput: 'server',
	} as any);
}

describe('@astrojs/cloudflare optimizeDeps includes', () => {
	it('pre-includes renderer server entrypoints and astro/logger/console for server environments', async () => {
		const integration = createIntegration();
		const updatedConfig = await runConfigSetup(integration);
		// Mirror what framework integrations register through `addRenderer`:
		// string entrypoints (`@astrojs/svelte`) and URL entrypoints.
		await runConfigDone(integration, [
			{
				name: '@astrojs/svelte',
				clientEntrypoint: '@astrojs/svelte/client.js',
				serverEntrypoint: '@astrojs/svelte/server.js',
			},
			{
				name: '@astrojs/react',
				clientEntrypoint: '@astrojs/react/client.js',
				serverEntrypoint: reactServerURL,
			},
		]);

		const plugins = updatedConfig.vite.plugins as any[];
		const environmentPlugin = plugins.find(
			(plugin) => plugin.name === '@astrojs/cloudflare:environment',
		);
		assert.ok(environmentPlugin, 'expected an @astrojs/cloudflare:environment plugin');

		// Renderer server entrypoints are imported lazily through
		// `virtual:astro:renderers`, so the optimizer scan cannot reach them. A
		// mid-request discovery would re-optimize the dependency cache while
		// workerd still references the old chunks; `astro/logger/console` is
		// always imported by the assets runtime logger setup. Both must be
		// pre-bundled during the initial pass.
		for (const environmentName of ['astro', 'ssr', 'prerender']) {
			const result = environmentPlugin.configEnvironment(environmentName, {
				optimizeDeps: { noDiscovery: false },
			});
			const include = result?.optimizeDeps?.include ?? [];
			assert.ok(
				Array.isArray(include) && include.includes('astro/logger/console'),
				`${environmentName} should pre-include astro/logger/console, got: ${JSON.stringify(include)}`,
			);
			assert.ok(
				include.includes('@astrojs/svelte/server.js'),
				`${environmentName} should pre-include string renderer server entrypoints, got: ${JSON.stringify(include)}`,
			);
			assert.ok(
				include.includes(reactServerPath),
				`${environmentName} should pre-include URL renderer server entrypoints, got: ${JSON.stringify(include)}`,
			);
		}
	});

	it('does not pre-include renderer server entrypoints for the client environment', async () => {
		const integration = createIntegration();
		const updatedConfig = await runConfigSetup(integration);
		await runConfigDone(integration, [
			{
				name: '@astrojs/svelte',
				clientEntrypoint: '@astrojs/svelte/client.js',
				serverEntrypoint: '@astrojs/svelte/server.js',
			},
		]);

		const plugins = updatedConfig.vite.plugins as any[];
		const environmentPlugin = plugins.find(
			(plugin) => plugin.name === '@astrojs/cloudflare:environment',
		);
		assert.ok(environmentPlugin, 'expected an @astrojs/cloudflare:environment plugin');

		const result = environmentPlugin.configEnvironment('client', {});
		const include = result?.optimizeDeps?.include ?? [];
		assert.ok(
			!include.includes('@astrojs/svelte/server.js'),
			`client environment should not pre-include server entrypoints, got: ${JSON.stringify(include)}`,
		);
	});

	it('skips renderer server entrypoints for the Node prerender environment', async () => {
		// With `prerenderEnvironment: 'node'` the prerender environment runs on
		// Node, where pre-bundling renderers would duplicate framework modules;
		// only the workerd environments (ssr, astro) get the renderer entries.
		const integration = createIntegration({ prerenderEnvironment: 'node' });
		const updatedConfig = await runConfigSetup(integration);
		await runConfigDone(integration, [
			{
				name: '@astrojs/svelte',
				clientEntrypoint: '@astrojs/svelte/client.js',
				serverEntrypoint: '@astrojs/svelte/server.js',
			},
		]);

		const plugins = updatedConfig.vite.plugins as any[];
		const environmentPlugin = plugins.find(
			(plugin) => plugin.name === '@astrojs/cloudflare:environment',
		);
		assert.ok(environmentPlugin, 'expected an @astrojs/cloudflare:environment plugin');

		for (const environmentName of ['ssr', 'astro']) {
			const result = environmentPlugin.configEnvironment(environmentName, {
				optimizeDeps: { noDiscovery: false },
			});
			const include = result?.optimizeDeps?.include ?? [];
			assert.ok(
				include.includes('@astrojs/svelte/server.js'),
				`${environmentName} should pre-include renderer server entrypoints, got: ${JSON.stringify(include)}`,
			);
		}

		const prerenderResult = environmentPlugin.configEnvironment('prerender', {
			optimizeDeps: { noDiscovery: false },
		});
		const prerenderInclude = prerenderResult?.optimizeDeps?.include ?? [];
		assert.ok(
			!prerenderInclude.includes('@astrojs/svelte/server.js'),
			`Node prerender environment should not pre-include renderer server entrypoints, got: ${JSON.stringify(prerenderInclude)}`,
		);
	});
});
