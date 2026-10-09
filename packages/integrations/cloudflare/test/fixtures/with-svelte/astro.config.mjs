import cloudflare from '@astrojs/cloudflare';
import svelte from "@astrojs/svelte";
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [svelte()],
	adapter: cloudflare(),
	output: 'server',
});
