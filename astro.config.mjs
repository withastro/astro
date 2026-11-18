// @ts-check

import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable Vue to support Vue components.
	integrations: [vue()],
});
