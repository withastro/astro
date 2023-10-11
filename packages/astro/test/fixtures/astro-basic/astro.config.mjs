import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
	integrations: [preact(), mdx()],
	// make sure CLI flags have precedence
  server: () => ({ port: 4321 })
});
