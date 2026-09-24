import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getLocalWorkerdCompatibilityDate } from '../dist/info.js';
import {
	cloudflareConfigCustomizer,
	DEFAULT_ASSETS_BINDING_NAME,
	DEFAULT_IMAGES_BINDING_NAME,
	DEFAULT_SESSION_KV_BINDING_NAME,
	withNodejsAlsFlag,
} from '../dist/cloudflare-config.js';

describe('cloudflareConfigCustomizer', () => {
	describe('compatibility date', () => {
		it('uses the date supported by the installed workerd', () => {
			const result = cloudflareConfigCustomizer()({});

			assert.equal(result.compatibilityDate, getLocalWorkerdCompatibilityDate().date);
		});

		it('preserves the user compatibility date', () => {
			const result = cloudflareConfigCustomizer()({ compatibilityDate: '2025-01-01' });

			assert.equal(result.compatibilityDate, '2025-01-01');
		});
	});

	describe('entrypoint', () => {
		it('sets the server entrypoint when none exists', () => {
			const result = cloudflareConfigCustomizer()({});

			assert.equal(result.entrypoint, '@astrojs/cloudflare/entrypoints/server');
		});

		it('preserves the user entrypoint', () => {
			const result = cloudflareConfigCustomizer()({ entrypoint: './src/worker.ts' });

			assert.equal(result.entrypoint, './src/worker.ts');
		});
	});

	describe('session KV binding', () => {
		it('adds the default SESSION binding through env', () => {
			const result = cloudflareConfigCustomizer()({});

			assert.deepEqual(result.env?.[DEFAULT_SESSION_KV_BINDING_NAME], { type: 'kv' });
		});

		it('adds a custom SESSION binding name', () => {
			const result = cloudflareConfigCustomizer({ sessionKVBindingName: 'MY_SESSION' })({});

			assert.deepEqual(result.env?.MY_SESSION, { type: 'kv' });
		});

		it('does not add the SESSION binding when it already exists', () => {
			const result = cloudflareConfigCustomizer()({
				env: { SESSION: { type: 'kv', id: 'existing-id' } },
			});

			assert.equal(result.env?.SESSION, undefined);
		});

		it('does not add the SESSION binding when it is disabled', () => {
			const result = cloudflareConfigCustomizer({ needsSessionKVBinding: false })({});

			assert.equal(result.env?.SESSION, undefined);
		});

		it('does not return user-declared bindings', () => {
			const result = cloudflareConfigCustomizer()({
				env: {
					RATE_LIMIT: { type: 'kv', id: 'rate-limit-id' },
					CACHE: { type: 'kv', id: 'cache-id' },
				},
			});

			assert.equal(result.env?.RATE_LIMIT, undefined);
			assert.equal(result.env?.CACHE, undefined);
			assert.deepEqual(result.env?.SESSION, { type: 'kv' });
		});
	});

	describe('images binding', () => {
		it('adds the default IMAGES binding through env', () => {
			const result = cloudflareConfigCustomizer()({});

			assert.deepEqual(result.env?.[DEFAULT_IMAGES_BINDING_NAME], { type: 'images' });
		});

		it('adds a custom IMAGES binding name', () => {
			const result = cloudflareConfigCustomizer({ imagesBindingName: 'MY_IMAGES' })({});

			assert.deepEqual(result.env?.MY_IMAGES, { type: 'images' });
		});

		it('does not add the IMAGES binding when it already exists', () => {
			const result = cloudflareConfigCustomizer()({ env: { IMAGES: { type: 'images' } } });

			assert.equal(result.env?.IMAGES, undefined);
		});

		it('does not add the IMAGES binding when one exists with a different name', () => {
			const result = cloudflareConfigCustomizer()({
				env: { CUSTOM_IMAGES: { type: 'images' } },
			});

			assert.equal(result.env?.IMAGES, undefined);
		});

		it('does not add the IMAGES binding when it is disabled', () => {
			const result = cloudflareConfigCustomizer({ imagesBindingName: false })({});

			assert.equal(result.env?.IMAGES, undefined);
		});
	});

	describe('assets binding', () => {
		it('adds the default ASSETS binding through env', () => {
			const result = cloudflareConfigCustomizer()({});

			assert.deepEqual(result.env?.[DEFAULT_ASSETS_BINDING_NAME], { type: 'assets' });
		});

		it('does not add the ASSETS binding when it already exists', () => {
			const result = cloudflareConfigCustomizer()({ env: { ASSETS: { type: 'assets' } } });

			assert.equal(result.env?.ASSETS, undefined);
		});

		it('does not add the ASSETS binding when one exists with a different name', () => {
			const result = cloudflareConfigCustomizer()({
				env: { CUSTOM_ASSETS: { type: 'assets' } },
			});

			assert.equal(result.env?.ASSETS, undefined);
		});
	});

	describe('worker cache', () => {
		it('enables cache when it is needed and not configured', () => {
			const result = cloudflareConfigCustomizer({ needsWorkerCache: true })({});

			assert.deepEqual(result.cache, { enabled: true });
		});

		it('does not enable cache when it is not needed', () => {
			const result = cloudflareConfigCustomizer({ needsWorkerCache: false })({});

			assert.equal(result.cache, undefined);
		});

		it('does not override an existing cache setting', () => {
			const result = cloudflareConfigCustomizer({ needsWorkerCache: true })({
				cache: { enabled: false },
			});

			assert.equal(result.cache, undefined);
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
