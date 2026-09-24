import cloudflare from '@astrojs/cloudflare';
import vue from "@astrojs/vue";
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [vue()],
	adapter: cloudflare(),
	output: 'server',
});
