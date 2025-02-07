import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';


export default defineConfig({
	adapter: cloudflare(),
	output: 'server',
});
