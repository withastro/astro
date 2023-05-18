import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import solidJs from "@astrojs/solid-js";

export default defineConfig({
	integrations: [solidJs()],
	adapter: cloudflare(),
	output: 'server',
});
