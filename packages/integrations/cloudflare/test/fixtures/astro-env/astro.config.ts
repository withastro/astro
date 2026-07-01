import cloudflare from '@astrojs/cloudflare';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
	env: {
		schema: {
			API_URL: envField.string({ context: 'client', access: 'public', optional: true }),
			PORT: envField.number({ context: 'server', access: 'public', default: 4321 }),
			API_SECRET: envField.string({ context: 'server', access: 'secret' }),
		},
	},
	adapter: cloudflare(),
	output: 'server',
});
