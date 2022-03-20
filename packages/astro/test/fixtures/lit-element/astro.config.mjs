import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';

// https://astro.build/config
export default defineConfig({
	integrations: [lit()],
});