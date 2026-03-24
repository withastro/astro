import cloudflare from '@astrojs/cloudflare';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
	adapter: cloudflare(),
	output: 'server',
	env: {
		schema: {
			COOL: envField.string({
        context: 'server',
        access: 'public',
      }),
		}
	}
});
