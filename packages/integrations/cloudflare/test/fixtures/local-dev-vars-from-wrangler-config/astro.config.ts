import cloudflare from '@astrojs/cloudflare';
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
	adapter: cloudflare(),
	output: 'static',
	env: {
		schema: {
			TEST_VAR: envField.string({
        context: 'server',
        access: 'public',
      }),
		}
	}
});
