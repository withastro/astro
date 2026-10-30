import * as assert from 'node:assert/strict';
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import type { ParsedInputConfigWithWorker } from '@cloudflare/vite-plugin';
import {
	assertWranglerConfigMigrated,
	cloudflareConfigCustomizer,
	DEFAULT_ASSETS_BINDING_NAME,
	DEFAULT_IMAGES_BINDING_NAME,
	DEFAULT_SESSION_KV_BINDING_NAME,
	withNodejsAlsFlag,
} from '../dist/cloudflare-config.js';

function createConfig(
	worker: Partial<ParsedInputConfigWithWorker['worker']> = {},
): ParsedInputConfigWithWorker {
	return {
		worker: { name: 'test-worker', compatibilityDate: '2026-10-01', env: {}, ...worker },
		containers: [],
	};
}

describe('cloudflareConfigCustomizer', () => {
	it('preserves account settings, Containers, and Worker configuration without mutating the input', () => {
		const config: ParsedInputConfigWithWorker = {
			...createConfig({
				compatibilityFlags: ['nodejs_compat'],
				assets: { runWorkerFirst: true },
				observability: { enabled: true },
			}),
			accountId: 'test-account',
			complianceRegion: 'public',
			containers: [
				{ name: 'test-container', image: { dockerfile: './Dockerfile' }, maxInstances: 20 },
			],
		};
		const original = structuredClone(config);

		const result = cloudflareConfigCustomizer()(config);

		assert.deepEqual(result, {
			...original,
			worker: {
				...original.worker,
				entrypoint: '@astrojs/cloudflare/entrypoints/server',
				env: {
					SESSION: { type: 'kv' },
					IMAGES: { type: 'images' },
					ASSETS: { type: 'assets' },
				},
			},
		});
		assert.deepEqual(config, original);
	});

	it('loads text, JSON, and secret bindings from the Worker into process.env', (t) => {
		const envDir = mkdtempSync(join(realpathSync(tmpdir()), 'astro-cloudflare-env-'));
		const names = ['ASTRO_CF_TEST_TEXT', 'ASTRO_CF_TEST_JSON', 'ASTRO_CF_TEST_SECRET'];
		const original = names.map((name) => process.env[name]);
		t.after(() => {
			rmSync(envDir, { recursive: true, force: true });
			for (const [index, name] of names.entries()) {
				if (original[index] === undefined) delete process.env[name];
				else process.env[name] = original[index];
			}
		});
		writeFileSync(join(envDir, '.dev.vars.production'), 'ASTRO_CF_TEST_SECRET=secret-value');

		cloudflareConfigCustomizer({ envDir, mode: 'production' })(
			createConfig({
				env: {
					ASTRO_CF_TEST_TEXT: { type: 'text', value: 'text-value' },
					ASTRO_CF_TEST_JSON: { type: 'json', value: { key: 'value' } },
					ASTRO_CF_TEST_SECRET: { type: 'secret' },
				},
			}),
		);

		assert.equal(process.env.ASTRO_CF_TEST_TEXT, 'text-value');
		assert.equal(process.env.ASTRO_CF_TEST_JSON, '{"key":"value"}');
		assert.equal(process.env.ASTRO_CF_TEST_SECRET, 'secret-value');
	});

	describe('compatibility date', () => {
		it('preserves the compatibility date', () => {
			const result = cloudflareConfigCustomizer()(createConfig());

			assert.equal(result.worker.compatibilityDate, '2026-10-01');
		});
	});

	describe('entrypoint', () => {
		it('sets the server entrypoint when none exists', () => {
			const result = cloudflareConfigCustomizer()(createConfig());

			assert.equal(result.worker.entrypoint, '@astrojs/cloudflare/entrypoints/server');
		});

		it('preserves the user entrypoint', () => {
			const result = cloudflareConfigCustomizer()(createConfig({ entrypoint: './src/worker.ts' }));

			assert.equal(result.worker.entrypoint, './src/worker.ts');
		});
	});

	describe('session KV binding', () => {
		it('adds the default SESSION binding through env', () => {
			const result = cloudflareConfigCustomizer()(createConfig());

			assert.deepEqual(result.worker.env?.[DEFAULT_SESSION_KV_BINDING_NAME], { type: 'kv' });
		});

		it('adds a custom SESSION binding name', () => {
			const result = cloudflareConfigCustomizer({ sessionKVBindingName: 'MY_SESSION' })(
				createConfig(),
			);

			assert.deepEqual(result.worker.env?.MY_SESSION, { type: 'kv' });
		});

		it('does not add the SESSION binding when it already exists', () => {
			const result = cloudflareConfigCustomizer()(
				createConfig({
					env: { SESSION: { type: 'kv', id: 'existing-id' } },
				}),
			);

			assert.deepEqual(result.worker.env?.SESSION, { type: 'kv', id: 'existing-id' });
		});

		it('does not add the SESSION binding when it is disabled', () => {
			const result = cloudflareConfigCustomizer({ needsSessionKVBinding: false })(createConfig());

			assert.equal(result.worker.env?.SESSION, undefined);
		});

		it('preserves user-declared bindings', () => {
			const result = cloudflareConfigCustomizer()(
				createConfig({
					env: {
						RATE_LIMIT: { type: 'kv', id: 'rate-limit-id' },
						CACHE: { type: 'kv', id: 'cache-id' },
					},
				}),
			);

			assert.deepEqual(result.worker.env?.RATE_LIMIT, { type: 'kv', id: 'rate-limit-id' });
			assert.deepEqual(result.worker.env?.CACHE, { type: 'kv', id: 'cache-id' });
			assert.deepEqual(result.worker.env?.SESSION, { type: 'kv' });
		});
	});

	describe('images binding', () => {
		it('adds the default IMAGES binding through env', () => {
			const result = cloudflareConfigCustomizer()(createConfig());

			assert.deepEqual(result.worker.env?.[DEFAULT_IMAGES_BINDING_NAME], { type: 'images' });
		});

		it('adds a custom IMAGES binding name', () => {
			const result = cloudflareConfigCustomizer({ imagesBindingName: 'MY_IMAGES' })(createConfig());

			assert.deepEqual(result.worker.env?.MY_IMAGES, { type: 'images' });
		});

		it('does not add the IMAGES binding when it already exists', () => {
			const result = cloudflareConfigCustomizer()(
				createConfig({ env: { IMAGES: { type: 'images' } } }),
			);

			assert.deepEqual(result.worker.env?.IMAGES, { type: 'images' });
		});

		it('does not add the IMAGES binding when one exists with a different name', () => {
			const result = cloudflareConfigCustomizer()(
				createConfig({
					env: { CUSTOM_IMAGES: { type: 'images' } },
				}),
			);

			assert.deepEqual(result.worker.env?.CUSTOM_IMAGES, { type: 'images' });
			assert.equal(result.worker.env?.IMAGES, undefined);
		});

		it('does not add the IMAGES binding when it is disabled', () => {
			const result = cloudflareConfigCustomizer({ imagesBindingName: false })(createConfig());

			assert.equal(result.worker.env?.IMAGES, undefined);
		});
	});

	describe('assets binding', () => {
		it('adds the default ASSETS binding through env', () => {
			const result = cloudflareConfigCustomizer()(createConfig());

			assert.deepEqual(result.worker.env?.[DEFAULT_ASSETS_BINDING_NAME], { type: 'assets' });
		});

		it('does not add the ASSETS binding when it already exists', () => {
			const result = cloudflareConfigCustomizer()(
				createConfig({ env: { ASSETS: { type: 'assets' } } }),
			);

			assert.deepEqual(result.worker.env?.ASSETS, { type: 'assets' });
		});

		it('does not add the ASSETS binding when one exists with a different name', () => {
			const result = cloudflareConfigCustomizer()(
				createConfig({
					env: { CUSTOM_ASSETS: { type: 'assets' } },
				}),
			);

			assert.deepEqual(result.worker.env?.CUSTOM_ASSETS, { type: 'assets' });
			assert.equal(result.worker.env?.ASSETS, undefined);
		});
	});

	describe('worker cache', () => {
		it('enables cache when it is needed and not configured', () => {
			const result = cloudflareConfigCustomizer({ needsWorkerCache: true })(createConfig());

			assert.deepEqual(result.worker.cache, { enabled: true });
		});

		it('does not enable cache when it is not needed', () => {
			const result = cloudflareConfigCustomizer({ needsWorkerCache: false })(createConfig());

			assert.equal(result.worker.cache, undefined);
		});

		it('does not override an existing cache setting', () => {
			const result = cloudflareConfigCustomizer({ needsWorkerCache: true })(
				createConfig({
					cache: { enabled: false },
				}),
			);

			assert.deepEqual(result.worker.cache, { enabled: false });
		});

		it('preserves additional cache options when cache is enabled', () => {
			const result = cloudflareConfigCustomizer({ needsWorkerCache: true })(
				createConfig({ cache: { enabled: true, crossVersionCache: true } }),
			);

			assert.deepEqual(result.worker.cache, { enabled: true, crossVersionCache: true });
		});
	});

	describe('default binding names', () => {
		it('exports the expected names', () => {
			assert.equal(DEFAULT_SESSION_KV_BINDING_NAME, 'SESSION');
			assert.equal(DEFAULT_IMAGES_BINDING_NAME, 'IMAGES');
			assert.equal(DEFAULT_ASSETS_BINDING_NAME, 'ASSETS');
		});
	});
});

// The build-time prerender worker needs AsyncLocalStorage to install the render
// scope that attributes incremental-build metadata per concurrent request.
describe('withNodejsAlsFlag', () => {
	it('appends nodejs_als when no compatibility flags are configured', () => {
		assert.deepEqual(withNodejsAlsFlag(undefined), ['nodejs_als']);
		assert.deepEqual(withNodejsAlsFlag([]), ['nodejs_als']);
	});

	it('appends nodejs_als when only unrelated flags are configured', () => {
		assert.deepEqual(withNodejsAlsFlag(['global_fetch_strictly_public']), [
			'global_fetch_strictly_public',
			'nodejs_als',
		]);
	});

	it('leaves ALS-capable flags alone', () => {
		assert.deepEqual(withNodejsAlsFlag(['nodejs_als']), ['nodejs_als']);
		assert.deepEqual(withNodejsAlsFlag(['nodejs_compat']), ['nodejs_compat']);
		assert.deepEqual(withNodejsAlsFlag(['nodejs_compat_v2']), ['nodejs_compat_v2']);
	});

	it('does not mutate the input array when appending', () => {
		const flags = ['global_fetch_strictly_public'];
		withNodejsAlsFlag(flags);
		assert.deepEqual(flags, ['global_fetch_strictly_public']);
	});
});

describe('assertWranglerConfigMigrated', () => {
	let root: string;

	beforeEach(() => {
		root = mkdtempSync(join(realpathSync(tmpdir()), 'astro-cloudflare-wrangler-'));
	});

	afterEach(() => {
		rmSync(root, { recursive: true, force: true });
	});

	for (const file of ['wrangler.json', 'wrangler.jsonc', 'wrangler.toml']) {
		it(`throws when ${file} exists without cloudflare.config.ts`, () => {
			writeFileSync(join(root, file), '');

			assert.throws(() => assertWranglerConfigMigrated(root), /cf migrate --bundler vite/);
		});
	}

	it('passes when cloudflare.config.ts exists next to a Wrangler config', () => {
		writeFileSync(join(root, 'wrangler.jsonc'), '');
		writeFileSync(join(root, 'cloudflare.config.ts'), '');

		assert.doesNotThrow(() => assertWranglerConfigMigrated(root));
	});

	it('passes when there is no Wrangler config', () => {
		assert.doesNotThrow(() => assertWranglerConfigMigrated(root));
	});
});
