import { defineConfig } from 'astro/config';
import integration from './integration.mjs';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	integrations: [integration()],
	adapter: cloudflare()
});
