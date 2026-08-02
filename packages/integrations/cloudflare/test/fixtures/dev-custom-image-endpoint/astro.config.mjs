import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

export default defineConfig({
	output: 'static',
	adapter: cloudflare({
		imageService: 'custom',
		prerenderEnvironment: 'node',
	}),
});
