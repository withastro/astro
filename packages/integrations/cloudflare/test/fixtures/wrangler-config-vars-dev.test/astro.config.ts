import cloudflare from '@astrojs/cloudflare';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
	adapter: cloudflare({
		platformProxy: {
			enabled: true,
		},
	}),
	output: 'server',
	env: {
		schema: {
			TEST: envField.string({
        context: 'server',
        access: 'public',
      }),
		}
	}
});
