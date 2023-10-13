import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';


export default defineConfig({
	adapter: cloudflare({
		runtime: 'local'
	}),
	output: 'server',
});
