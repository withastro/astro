import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createViteBuildConfig } from '../../../dist/core/build/vite-build-config.js';
import { createBasicSettings } from '../test-utils.ts';

const noopIsRollupInput = () => false;

/** Shorthand to call createViteBuildConfig with minimal defaults. */
function buildConfig(
	overrides: Partial<Parameters<typeof createViteBuildConfig>[0]> = {},
) {
	return createViteBuildConfig({
		settings: overrides.settings!,
		viteConfig: overrides.viteConfig ?? {},
		routes: overrides.routes ?? [],
		plugins: overrides.plugins ?? [],
		builder: overrides.builder ?? {},
		isRollupInput: overrides.isRollupInput ?? noopIsRollupInput,
	});
}

describe('createViteBuildConfig', () => {
	describe('top-level rollup output', () => {
		it('preserves user assetFileNames override', async () => {
			const settings = await createBasicSettings();
			const customAssetFn = () => 'assets/css/a.css';
			const config = buildConfig({
				settings,
				viteConfig: {
					build: {
						rollupOptions: {
							output: { assetFileNames: customAssetFn },
						},
					},
				},
			});

			const output = config.build?.rollupOptions?.output as Record<string, unknown>;
			assert.equal(output.assetFileNames, customAssetFn);
		});

		it('preserves user chunkFileNames override', async () => {
			const settings = await createBasicSettings();
			const customChunkFn = () => 'chunks/[name].js';
			const config = buildConfig({
				settings,
				viteConfig: {
					build: {
						rollupOptions: {
							output: { chunkFileNames: customChunkFn },
						},
					},
				},
			});

			const output = config.build?.rollupOptions?.output as Record<string, unknown>;
			assert.equal(output.chunkFileNames, customChunkFn);
		});

		it('uses Astro default assetFileNames when no user override provided', async () => {
			const settings = await createBasicSettings();
			const config = buildConfig({ settings });

			const output = config.build?.rollupOptions?.output as Record<string, any>;
			assert.equal(typeof output.assetFileNames, 'function');
			const result = output.assetFileNames({ names: ['style.css'] });
			assert.match(result, /\[name\]\.\[hash\]\[extname\]/);
		});

		it('entryFileNames is always a function (not overridable by user output spread)', async () => {
			const settings = await createBasicSettings();
			const config = buildConfig({
				settings,
				viteConfig: {
					build: {
						rollupOptions: {
							output: { entryFileNames: 'custom/[name].js' },
						},
					},
				},
			});

			const output = config.build?.rollupOptions?.output as Record<string, any>;
			assert.equal(typeof output.entryFileNames, 'function');
		});

		it('default assetFileNames uses settings.config.build.assets as prefix', async () => {
			const settings = await createBasicSettings({ build: { assets: 'custom_dir_1' } });
			const config = buildConfig({ settings });

			const output = config.build?.rollupOptions?.output as Record<string, any>;
			const result = output.assetFileNames({ names: ['style.css'] });
			assert.match(result, /^custom_dir_1\//);
		});
	});

	describe('client environment', () => {
		it('preserves user assetFileNames override', async () => {
			const settings = await createBasicSettings();
			const customAssetFn = () => 'custom/[name].[ext]';
			const config = buildConfig({
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
			});

			const clientEnv = config.environments?.client as Record<string, any>;
			const output = clientEnv.build.rollupOptions.output;
			assert.equal(output.assetFileNames, customAssetFn);
		});

		it('preserves user entryFileNames override', async () => {
			const settings = await createBasicSettings();
			const config = buildConfig({
				settings,
				viteConfig: {
					environments: {
						client: {
							build: {
								rollupOptions: {
									output: { entryFileNames: 'assets/js/[name].js' },
								},
							},
						},
					},
				},
			});

			const clientEnv = config.environments?.client as Record<string, any>;
			const output = clientEnv.build.rollupOptions.output;
			assert.equal(output.entryFileNames, 'assets/js/[name].js');
		});

		it('default assetFileNames uses settings.config.build.assets as prefix', async () => {
			const settings = await createBasicSettings({ build: { assets: 'custom_dir_1' } });
			const config = buildConfig({ settings });

			const clientEnv = config.environments?.client as Record<string, any>;
			const output = clientEnv.build.rollupOptions.output;
			const result = output.assetFileNames({ names: ['style.css'] });
			assert.match(result, /^custom_dir_1\//);
		});
	});

	describe('prerender environment', () => {
		it('preserves user rollup output overrides', async () => {
			const settings = await createBasicSettings();
			const config = buildConfig({
				settings,
				viteConfig: {
					environments: {
						prerender: {
							build: {
								rollupOptions: {
									output: {
										chunkFileNames: 'assets/testing-[name].mjs',
										assetFileNames: 'assets/testing-[name].[ext]',
									},
								},
							},
						},
					},
				},
			});

			const prerenderEnv = config.environments?.prerender as Record<string, any>;
			const output = prerenderEnv.build.rollupOptions.output;
			assert.equal(output.chunkFileNames, 'assets/testing-[name].mjs');
			assert.equal(output.assetFileNames, 'assets/testing-[name].[ext]');
		});
	});

	describe('general config', () => {
		it('sets base from settings config', async () => {
			const settings = await createBasicSettings({ base: '/blog' });
			const config = buildConfig({ settings });
			assert.equal(config.base, '/blog');
		});

		it('sets envPrefix from viteConfig or defaults to PUBLIC_', async () => {
			const settings = await createBasicSettings();

			const config1 = buildConfig({ settings });
			assert.equal(config1.envPrefix, 'PUBLIC_');

			const config2 = buildConfig({ settings, viteConfig: { envPrefix: 'CUSTOM_' } });
			assert.equal(config2.envPrefix, 'CUSTOM_');
		});

		it('sets cssMinify based on vite build.minify', async () => {
			const settings = await createBasicSettings();

			// Default (no minify set) -> true
			const config1 = buildConfig({ settings });
			assert.equal(config1.build?.cssMinify, true);

			// minify explicitly false -> false
			const config2 = buildConfig({ settings, viteConfig: { build: { minify: false } } });
			assert.equal(config2.build?.cssMinify, false);
		});
	});
});
