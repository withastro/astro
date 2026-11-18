import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mergeConfig } from '../../../dist/core/config/index.js';

describe('mergeConfig', () => {
	it('keeps server.allowedHosts as boolean', () => {
		const defaults = {
			server: {
				// Typed as string[] to match AstroConfig's allowedHosts field
				allowedHosts: [] as string[],
			},
		};
		// allowedHosts can also be true (allow all) — cast to satisfy DeepPartial
		const overrides = {
			server: {
				allowedHosts: true as boolean | string[],
			},
		};
		const merged = mergeConfig(defaults, overrides as typeof defaults);
		assert.equal(merged.server.allowedHosts, true);
	});

	it('ignores image.service overrides with only undefined values', () => {
		const service = {
			build: { entrypoint: 'astro/assets/services/sharp' },
			runtime: { entrypoint: 'astro/assets/services/noop' },
		};
		const merged = mergeConfig(
			{ image: { service } } as any,
			{ image: { service: { entrypoint: undefined } } } as any,
		);
		assert.deepEqual(merged.image.service, service);
	});

	it('replaces { build, runtime } image.service with a single service', () => {
		const merged = mergeConfig(
			{
				image: {
					service: {
						build: { entrypoint: 'astro/assets/services/sharp' },
						runtime: { entrypoint: 'astro/assets/services/noop' },
					},
				},
			} as any,
			{ image: { service: { entrypoint: '@astrojs/netlify/image-service.js' } } } as any,
		);
		assert.deepEqual(merged.image.service, { entrypoint: '@astrojs/netlify/image-service.js' });
	});
});
