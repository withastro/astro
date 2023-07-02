import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
	// Enable Astro to support React JSX components.
	integrations: [react()],
});
