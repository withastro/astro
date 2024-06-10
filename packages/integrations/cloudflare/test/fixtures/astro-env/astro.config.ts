import cloudflare from '@astrojs/cloudflare';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
	experimental: {
		rewriting: false,
		env: {
			schema: {
				PUBLIC_API_URL: envField.string({ context: 'client', access: 'public', optional: true }),
				PUBLIC_PORT: envField.number({ context: 'server', access: 'public', default: 4321 }),
				// API_SECRET: envField.string({ context: 'server', access: 'secret' }),
			},
		},
	},
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
	output: 'server',
});
