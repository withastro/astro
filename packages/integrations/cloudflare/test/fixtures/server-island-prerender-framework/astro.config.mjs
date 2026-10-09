import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import solidJs from '@astrojs/solid-js';

export default defineConfig({
	adapter: cloudflare(),
	integrations: [solidJs()],
});
