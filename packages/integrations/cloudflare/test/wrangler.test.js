import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	cloudflareConfigCustomizer,
	DEFAULT_ASSETS_BINDING_NAME,
	DEFAULT_IMAGES_BINDING_NAME,
	DEFAULT_SESSION_KV_BINDING_NAME,
} from '../dist/wrangler.js';

describe('cloudflareConfigCustomizer', () => {
	describe('main entrypoint', () => {
		it('sets main to the server entrypoint when none exists', () => {
			const customizer = cloudflareConfigCustomizer();
			const result = customizer({});

			assert.equal(result.main, '@astrojs/cloudflare/entrypoints/server');
		});

		it('preserves user main entrypoint', () => {
			const customizer = cloudflareConfigCustomizer();
			const result = customizer({ main: './src/worker.ts' });

			assert.equal(result.main, './src/worker.ts');
		});
	});

	describe('session KV binding', () => {
		it('adds default SESSION KV binding when none exists', () => {
			const customizer = cloudflareConfigCustomizer();
			const result = customizer({});

			assert.deepEqual(result.kv_namespaces, [{ binding: DEFAULT_SESSION_KV_BINDING_NAME }]);
		});

		it('adds custom SESSION KV binding name when specified', () => {
			const customizer = cloudflareConfigCustomizer({ sessionKVBindingName: 'MY_SESSION' });
			const result = customizer({});

			assert.deepEqual(result.kv_namespaces, [{ binding: 'MY_SESSION' }]);
		});

		it('does not add SESSION binding when one already exists with default name', () => {
			const customizer = cloudflareConfigCustomizer();
			const result = customizer({
				kv_namespaces: [{ binding: DEFAULT_SESSION_KV_BINDING_NAME, id: 'existing-id' }],
			});

			assert.equal(result.kv_namespaces, undefined);
		});

		it('does not add SESSION binding when one already exists with custom name', () => {
			const customizer = cloudflareConfigCustomizer({ sessionKVBindingName: 'MY_SESSION' });
			const result = customizer({
				kv_namespaces: [{ binding: 'MY_SESSION', id: 'existing-id' }],
			});

			assert.equal(result.kv_namespaces, undefined);
		});

		it('adds SESSION binding when other KV bindings exist but not the session one', () => {
			const customizer = cloudflareConfigCustomizer();
			const result = customizer({
				kv_namespaces: [{ binding: 'OTHER_KV', id: 'other-id' }],
			});

			assert.deepEqual(result.kv_namespaces, [{ binding: DEFAULT_SESSION_KV_BINDING_NAME }]);
		});
	});

	describe('images binding', () => {
		it('adds default IMAGES binding when none exists', () => {
			const customizer = cloudflareConfigCustomizer();
			const result = customizer({});

			assert.deepEqual(result.images, { binding: DEFAULT_IMAGES_BINDING_NAME });
		});

		it('adds custom IMAGES binding name when specified', () => {
			const customizer = cloudflareConfigCustomizer({ imagesBindingName: 'MY_IMAGES' });
			const result = customizer({});

			assert.deepEqual(result.images, { binding: 'MY_IMAGES' });
		});

		it('does not add IMAGES binding when one already exists', () => {
			const customizer = cloudflareConfigCustomizer();
			const result = customizer({
				images: { binding: 'EXISTING_IMAGES' },
			});

			assert.equal(result.images, undefined);
		});

		it('does not add IMAGES binding when explicitly disabled', () => {
			const customizer = cloudflareConfigCustomizer({ imagesBindingName: false });
			const result = customizer({});

			assert.equal(result.images, undefined);
		});
	});

	describe('assets binding', () => {
		it('adds default ASSETS binding when none exists', () => {
			const customizer = cloudflareConfigCustomizer();
			const result = customizer({});

			assert.deepEqual(result.assets, { binding: DEFAULT_ASSETS_BINDING_NAME });
		});

		it('does not add ASSETS binding when one already exists', () => {
			const customizer = cloudflareConfigCustomizer();
			const result = customizer({
				assets: { binding: 'MY_ASSETS', directory: './dist' },
			});

			assert.equal(result.assets, undefined);
		});
	});

	describe('default binding names', () => {
		it('exports DEFAULT_SESSION_KV_BINDING_NAME as SESSION', () => {
			assert.equal(DEFAULT_SESSION_KV_BINDING_NAME, 'SESSION');
		});

		it('exports DEFAULT_IMAGES_BINDING_NAME as IMAGES', () => {
			assert.equal(DEFAULT_IMAGES_BINDING_NAME, 'IMAGES');
		});

		it('exports DEFAULT_ASSETS_BINDING_NAME as ASSETS', () => {
			assert.equal(DEFAULT_ASSETS_BINDING_NAME, 'ASSETS');
		});
	});
});
