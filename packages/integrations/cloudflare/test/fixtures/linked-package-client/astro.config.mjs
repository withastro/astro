import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [react()],
	adapter: cloudflare(),
	output: 'server',
});
