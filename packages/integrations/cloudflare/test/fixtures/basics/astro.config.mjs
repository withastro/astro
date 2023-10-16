import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// test env var
process.env.SECRET_STUFF = 'secret'

export default defineConfig({
	adapter: cloudflare(),
	output: 'server'
});
