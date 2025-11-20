// @ts-check

import alpine from '@astrojs/alpinejs';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [alpine()],
});
