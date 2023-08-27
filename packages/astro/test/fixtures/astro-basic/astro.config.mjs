import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
	integrations: [preact()],
	// make sure CLI flags have precedence
  server: () => ({ port: 4321 })
});
