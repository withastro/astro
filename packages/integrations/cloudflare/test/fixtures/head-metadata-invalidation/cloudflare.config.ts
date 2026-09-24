import { defineConfig } from 'cf/config';
import * as entrypoint from '@astrojs/cloudflare/entrypoints/server' with { type: 'cf-worker' };

export default defineConfig({
	worker: {
		name: 'head-metadata-invalidation',
		compatibilityDate: '2026-01-28',
		entrypoint,
	},
});
