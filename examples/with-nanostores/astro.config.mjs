// @ts-check

import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable many frameworks to support all different kinds of components.
	integrations: [preact()],
});
