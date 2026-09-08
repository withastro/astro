import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { HookParameters } from 'astro';
import type { Plugin } from 'vite';
import cloudflare from '../dist/index.js';

// `astro build` and `astro sync` both run type generation (build via its
// internal sync pass), which creates a temporary Vite server. #16961 made the
// adapter skip two things on that server: the `configureServer` hook of the
// Cloudflare Vite plugins (which boots the workerd runtime, see #16332) and
// dependency discovery (`optimizeDeps.noDiscovery`), so type generation never
// re-optimizes a dependency cache another environment may be holding on to.
// These tests pin both effects by invoking `astro:config:setup` directly and
// asserting the resolved Vite config — no build, no server, deterministic.

interface OptimizeDepsPatch {
	optimizeDeps?: { noDiscovery?: boolean; include?: string[]; exclude?: string[] };
}

async function runConfigSetup(
	command: 'dev' | 'build' | 'sync',
	loggerConfig?: { entrypoint: string },
	cacheConfig?: { provider?: { name: string; entrypoint: string } },
) {
	const integration = cloudflare();
	let updatedConfig: { vite: { plugins: unknown[] } } | undefined;

	const context = {
		command,
		config: {
			root: new URL('./', import.meta.url),
			srcDir: new URL('./src/', import.meta.url),
			base: '/',
			build: { assets: '_astro' },
			experimental: {},
			vite: {},
			image: {},
			logger: loggerConfig,
			cache: cacheConfig,
		},
		updateConfig(config: { vite: { plugins: unknown[] } }) {
			updatedConfig = config;
		},
		logger: { info() {}, warn() {}, error() {}, debug() {} },
		addWatchFile() {},
	};

	await integration.hooks['astro:config:setup']?.(
		context as unknown as HookParameters<'astro:config:setup'>,
	);
	assert.ok(updatedConfig, 'expected the adapter to call updateConfig()');

	const plugins = updatedConfig.vite.plugins;
	// `cfVitePlugin()` returns an array of plugins that the adapter passes
	// through as a single nested entry; every adapter-authored plugin is flat.
	const cloudflareVitePlugins = plugins.find(Array.isArray) as Plugin[] | undefined;
	assert.ok(
		cloudflareVitePlugins?.length,
		'expected the resolved Vite config to contain the Cloudflare Vite plugins',
	);

	const environmentPlugin = plugins
		.flat()
		.find((plugin) => (plugin as Plugin)?.name === '@astrojs/cloudflare:environment') as
		| Plugin
		| undefined;
	assert.ok(environmentPlugin, 'expected the @astrojs/cloudflare:environment plugin');
	const configEnvironment = environmentPlugin.configEnvironment as unknown as (
		environmentName: string,
		options: Record<string, unknown>,
	) => OptimizeDepsPatch | undefined;

	return { cloudflareVitePlugins, configEnvironment };
}

describe('type generation phase (build and sync)', () => {
	for (const command of ['build', 'sync'] as const) {
		describe(`command: ${command}`, () => {
			it('drops configureServer so type generation does not boot workerd', async () => {
				const { cloudflareVitePlugins } = await runConfigSetup(command);
				for (const plugin of cloudflareVitePlugins) {
					assert.equal(
						plugin.configureServer,
						undefined,
						`expected configureServer to be removed from "${plugin.name}"`,
					);
				}
			});

			it('disables dependency discovery for every Vite environment', async () => {
				const { configEnvironment } = await runConfigSetup(command);
				for (const environmentName of ['client', 'ssr', 'astro', 'prerender']) {
					assert.deepEqual(
						configEnvironment(environmentName, {}),
						{ optimizeDeps: { noDiscovery: true, include: [] } },
						`expected dependency discovery to be disabled for the "${environmentName}" environment`,
					);
				}
			});
		});
	}

	// The dev command exercises the same code paths with the guard off, proving
	// the assertions above discriminate: reverting the `isTypeGenPhase` guard
	// makes build/sync produce this dev-shaped config and fail the tests above.
	describe('command: dev', () => {
		it('keeps configureServer so the dev server boots the workerd runtime', async () => {
			const { cloudflareVitePlugins } = await runConfigSetup('dev');
			assert.ok(
				cloudflareVitePlugins.some((plugin) => plugin.configureServer != null),
				'expected at least one Cloudflare Vite plugin to register configureServer',
			);
		});

		it('keeps dependency discovery and prebundles the Actions server entrypoints', async () => {
			const { configEnvironment } = await runConfigSetup('dev');
			const result = configEnvironment('ssr', {});
			assert.notEqual(result?.optimizeDeps?.noDiscovery, true);
			const include = result?.optimizeDeps?.include ?? [];
			// Actions projects hit the server runtime through these prebundled
			// entrypoints (#16933); losing them reintroduces mid-request discovery.
			assert.ok(include.includes('astro/actions/runtime/entrypoints/server.js'));
			assert.ok(include.includes('astro/actions/runtime/entrypoints/route.js'));
		});

		it('prebundles astro/app/manifest for server environments', async () => {
			const { configEnvironment } = await runConfigSetup('dev');
			const include = configEnvironment('ssr', {})?.optimizeDeps?.include ?? [];
			assert.ok(include.includes('astro/app/manifest'));
		});

		it('only prebundles the cache provider when Workers Caching is enabled', async () => {
			const withoutCache = await runConfigSetup('dev');
			const withoutCacheInclude =
				withoutCache.configEnvironment('ssr', {})?.optimizeDeps?.include ?? [];
			assert.ok(!withoutCacheInclude.includes('@astrojs/cloudflare/cache/provider'));

			const withCache = await runConfigSetup('dev', undefined, {
				provider: { name: 'cloudflare', entrypoint: '@astrojs/cloudflare/cache/provider' },
			});
			const withCacheInclude = withCache.configEnvironment('ssr', {})?.optimizeDeps?.include ?? [];
			assert.ok(withCacheInclude.includes('@astrojs/cloudflare/cache/provider'));
		});

		it('only prebundles the JSON logger when it is enabled', async () => {
			const defaultConfig = await runConfigSetup('dev');
			const defaultInclude =
				defaultConfig.configEnvironment('ssr', {})?.optimizeDeps?.include ?? [];
			assert.ok(!defaultInclude.includes('astro/logger/json'));

			const consoleConfig = await runConfigSetup('dev', { entrypoint: 'astro/logger/console' });
			const consoleInclude =
				consoleConfig.configEnvironment('ssr', {})?.optimizeDeps?.include ?? [];
			assert.ok(!consoleInclude.includes('astro/logger/json'));

			const jsonConfig = await runConfigSetup('dev', { entrypoint: 'astro/logger/json' });
			const jsonInclude = jsonConfig.configEnvironment('ssr', {})?.optimizeDeps?.include ?? [];
			assert.ok(jsonInclude.includes('astro/logger/json'));
		});
	});
});
