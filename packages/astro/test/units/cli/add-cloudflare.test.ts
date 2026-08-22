import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createCloudflareWranglerConfig } from '../../../dist/cli/add/cloudflare.js';

describe('astro add cloudflare', () => {
	it('scaffolds a workerd-compatible Wrangler config', () => {
		const config = JSON.parse(createCloudflareWranglerConfig('my-project'));

		assert.deepEqual(config, {
			$schema: './node_modules/wrangler/config-schema.json',
			compatibility_date: '2026-04-15',
			compatibility_flags: ['global_fetch_strictly_public'],
			name: 'my-project',
			main: '@astrojs/cloudflare/entrypoints/server',
			assets: {
				directory: './dist',
				binding: 'ASSETS',
			},
			observability: {
				enabled: true,
			},
		});
	});
});
