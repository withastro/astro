import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalizeImageServiceConfig } from '../dist/utils/image-config.js';

describe('normalizeImageServiceConfig', () => {
	it('keeps the cloudflare-binding shorthand runtime-only', () => {
		assert.deepEqual(normalizeImageServiceConfig('cloudflare-binding'), {
			buildService: 'cloudflare-binding',
			runtimeService: 'cloudflare-binding',
			transformAtBuild: false,
		});
	});

	it('opts compound cloudflare-binding config into build-time transforms', () => {
		assert.deepEqual(
			normalizeImageServiceConfig({
				build: 'cloudflare-binding',
				runtime: 'cloudflare-binding',
			}),
			{
				buildService: 'cloudflare-binding',
				runtimeService: 'cloudflare-binding',
				transformAtBuild: true,
			},
		);
	});
});
