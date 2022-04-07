import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// Enable the Preact integration to support Preact JSX components.
	integrations: [preact()],
});
