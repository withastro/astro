import { bindings, defineConfig } from 'cf/config';
import * as entrypoint from '@astrojs/cloudflare/entrypoints/server' with { type: 'cf-worker' };

export default defineConfig({
	worker: {
		name: 'test',
		compatibilityDate: '2026-01-28',
		entrypoint,
		env: {
			COOL: bindings.text('ME'),
		},
	},
});
