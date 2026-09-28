import { bindings, defineConfig } from 'cf/config';
import * as entrypoint from '@astrojs/cloudflare/entrypoints/server' with { type: 'cf-worker' };

export default defineConfig({
	worker: {
		name: 'test-cache-provider',
		compatibilityDate: '2026-01-28',
		entrypoint,
		env: {
			CF_VERSION_METADATA: bindings.versionMetadata(),
		},
	},
});
