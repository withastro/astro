import vercel from '@astrojs/vercel/static';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: vercel({imageService: true}),
	experimental: {
		assets: true
	}
});
