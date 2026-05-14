import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { makeAstroPageEntryPointFileName } from '../../../dist/core/build/static-build.js';
import { createViteBuildConfig } from '../../../dist/core/build/vite-build-config.js';
import { cleanChunkName } from '../../../dist/core/build/util.js';
import type { RouteData } from '../../../dist/types/public/internal.js';
import { createBasicSettings } from '../test-utils.ts';

describe('astro/src/core/build', () => {
	describe('cleanChunkName', () => {
		it('passes through safe names unchanged', () => {
			assert.equal(cleanChunkName('page'), 'page');
			assert.equal(cleanChunkName('my-component'), 'my-component');
			assert.equal(cleanChunkName('pages/index'), 'pages/index');
			assert.equal(cleanChunkName('chunk_abc123'), 'chunk_abc123');
		});

		it('replaces ! and ~ characters', () => {
			assert.equal(cleanChunkName('page.!{005}'), 'page.__005_');
			assert.equal(cleanChunkName('~something'), '_something');
		});

		it('replaces other unsafe characters', () => {
			assert.equal(cleanChunkName('name@scope'), 'name_scope');
			assert.equal(cleanChunkName('file#hash'), 'file_hash');
		});

		it('replaces % character', () => {
			assert.equal(cleanChunkName('chunk%name'), 'chunk_name');
		});
	});

	describe('createViteBuildConfig', () => {
		const noopIsRollupInput = () => false;

		it('preserves user assetFileNames override in top-level output', async () => {
			const settings = await createBasicSettings();
			const customAssetFn = () => 'assets/css/a.css';
			const config = createViteBuildConfig({
				settings,
				viteConfig: {
					build: {
						rollupOptions: {
							output: { assetFileNames: customAssetFn },
						},
					},
				},
				routes: [],
				plugins: [],
				builder: {},
				isRollupInput: noopIsRollupInput,
			});

			const output = config.build?.rollupOptions?.output as Record<string, unknown>;
			assert.equal(output.assetFileNames, customAssetFn);
		});

		it('preserves user chunkFileNames override in top-level output', async () => {
			const settings = await createBasicSettings();
			const customChunkFn = () => 'chunks/[name].js';
			const config = createViteBuildConfig({
				settings,
				viteConfig: {
					build: {
						rollupOptions: {
							output: { chunkFileNames: customChunkFn },
						},
					},
				},
				routes: [],
				plugins: [],
				builder: {},
				isRollupInput: noopIsRollupInput,
			});

			const output = config.build?.rollupOptions?.output as Record<string, unknown>;
			assert.equal(output.chunkFileNames, customChunkFn);
		});

		it('preserves user assetFileNames override in client environment', async () => {
			const settings = await createBasicSettings();
			const customAssetFn = () => 'custom/[name].[ext]';
			const config = createViteBuildConfig({
				settings,
				viteConfig: {
					environments: {
						client: {
							build: {
								rollupOptions: {
									output: { assetFileNames: customAssetFn },
								},
							},
						},
					},
				},
				routes: [],
				plugins: [],
				builder: {},
				isRollupInput: noopIsRollupInput,
			});

			const clientEnv = config.environments?.client as Record<string, any>;
			const output = clientEnv.build.rollupOptions.output;
			assert.equal(output.assetFileNames, customAssetFn);
		});

		it('uses Astro default assetFileNames when no user override provided', async () => {
			const settings = await createBasicSettings();
			const config = createViteBuildConfig({
				settings,
				viteConfig: {},
				routes: [],
				plugins: [],
				builder: {},
				isRollupInput: noopIsRollupInput,
			});

			const output = config.build?.rollupOptions?.output as Record<string, any>;
			// The default assetFileNames should be a function (Astro's default handler)
			assert.equal(typeof output.assetFileNames, 'function');
			// Calling it with a normal asset should produce the default pattern
			const result = output.assetFileNames({ names: ['style.css'] });
			assert.match(result, /\[name\]\.\[hash\]\[extname\]/);
		});

		it('entryFileNames is always a function (not overridable by user output spread)', async () => {
			const settings = await createBasicSettings();
			const config = createViteBuildConfig({
				settings,
				viteConfig: {
					build: {
						rollupOptions: {
							output: { entryFileNames: 'custom/[name].js' },
						},
					},
				},
				routes: [],
				plugins: [],
				builder: {},
				isRollupInput: noopIsRollupInput,
			});

			const output = config.build?.rollupOptions?.output as Record<string, any>;
			// entryFileNames is defined AFTER the user spread, so it should always be Astro's function
			assert.equal(typeof output.entryFileNames, 'function');
		});

		it('sets base from settings config', async () => {
			const settings = await createBasicSettings({ base: '/blog' });
			const config = createViteBuildConfig({
				settings,
				viteConfig: {},
				routes: [],
				plugins: [],
				builder: {},
				isRollupInput: noopIsRollupInput,
			});

			assert.equal(config.base, '/blog');
		});

		it('sets envPrefix from viteConfig or defaults to PUBLIC_', async () => {
			const settings = await createBasicSettings();

			// Default
			const config1 = createViteBuildConfig({
				settings,
				viteConfig: {},
				routes: [],
				plugins: [],
				builder: {},
				isRollupInput: noopIsRollupInput,
			});
			assert.equal(config1.envPrefix, 'PUBLIC_');

			// Custom
			const config2 = createViteBuildConfig({
				settings,
				viteConfig: { envPrefix: 'CUSTOM_' },
				routes: [],
				plugins: [],
				builder: {},
				isRollupInput: noopIsRollupInput,
			});
			assert.equal(config2.envPrefix, 'CUSTOM_');
		});

		it('sets cssMinify based on vite build.minify', async () => {
			const settings = await createBasicSettings();

			// Default (no minify set) -> cssMinify should be true
			const config1 = createViteBuildConfig({
				settings,
				viteConfig: {},
				routes: [],
				plugins: [],
				builder: {},
				isRollupInput: noopIsRollupInput,
			});
			assert.equal(config1.build?.cssMinify, true);

			// minify explicitly false -> cssMinify should be false
			const config2 = createViteBuildConfig({
				settings,
				viteConfig: { build: { minify: false } },
				routes: [],
				plugins: [],
				builder: {},
				isRollupInput: noopIsRollupInput,
			});
			assert.equal(config2.build?.cssMinify, false);
		});
	});

	describe('makeAstroPageEntryPointFileName', () => {
		const routes: RouteData[] = [
			{
				route: '/',
				component: 'src/pages/index.astro',
				pathname: '/',
			},
			{
				route: '/injected',
				component: '../node_modules/my-dep/injected.astro',
				pathname: '/injected',
			},
			{
				route: '/injected-workspace',
				component: '../../packages/demo/[...all].astro',
				pathname: undefined,
			},
			{
				route: '/blog/[year]/[...slug]',
				component: 'src/pages/blog/[year]/[...slug].astro',
				pathname: undefined,
			},
		] as RouteData[];

		it('handles local pages', async () => {
			const input = '@astro-page:src/pages/index@_@astro';
			const output = 'pages/index.astro.mjs';
			const result = makeAstroPageEntryPointFileName('@astro-page:', input, routes);
			assert.equal(result, output);
		});

		it('handles dynamic pages', async () => {
			const input = '@astro-page:src/pages/blog/[year]/[...slug]@_@astro';
			const output = 'pages/blog/_year_/_---slug_.astro.mjs';
			const result = makeAstroPageEntryPointFileName('@astro-page:', input, routes);
			assert.equal(result, output);
		});

		it('handles node_modules pages', async () => {
			const input = '@astro-page:../node_modules/my-dep/injected@_@astro';
			const output = 'pages/injected.astro.mjs';
			const result = makeAstroPageEntryPointFileName('@astro-page:', input, routes);
			assert.equal(result, output);
		});

		// Fix #7561
		it('handles local workspace pages', async () => {
			const input = '@astro-page:../../packages/demo/[...all]@_@astro';
			const output = 'pages/injected-workspace.astro.mjs';
			const result = makeAstroPageEntryPointFileName('@astro-page:', input, routes);
			assert.equal(result, output);
		});
	});
});
