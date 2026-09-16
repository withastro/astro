import preact from '@astrojs/preact';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [react({
		include: ["**/react/*", "**/RCounter.jsx"]
	}), preact({
		include: ["**/preact/*", "**/PCounter.jsx"]
	})],
});
