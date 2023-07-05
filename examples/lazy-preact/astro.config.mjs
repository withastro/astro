import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
	// Enable Preact to support Preact JSX components.
	// You need to add compat, if you want to use Suspense and lazy functions
	integrations: [preact({compat: true})],
});
