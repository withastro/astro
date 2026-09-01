import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [mdx()],
	adapter: cloudflare({
		imageService: 'compile',
	}),
	output: 'static',
	image: {
		service: {
			entrypoint: './src/image-service.ts',
		},
	},
	build: {
		concurrency: 2,
	},
	experimental: {
		incrementalBuild: true,
	},
});
