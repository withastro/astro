import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
	// Enable the Preact integration to support Preact JSX components.
	integrations: [preact()],
});
