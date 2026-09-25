import { bindings, defineConfig } from 'cf/config';
import * as entrypoint from '@astrojs/cloudflare/entrypoints/server' with { type: 'cf-worker' };

export default defineConfig({
	worker: {
		name: 'astro-env',
		compatibilityDate: '2026-01-28',
		entrypoint,
		env: {
			API_URL: bindings.text('https://google.de'),
			PORT: bindings.json(4322),
			API_SECRET: bindings.secret(),
		},
	},
});
