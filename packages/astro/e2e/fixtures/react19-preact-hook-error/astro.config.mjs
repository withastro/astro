import preact from '@astrojs/preact';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [
		// This issue only reproduces when the Preact integration is placed before the React integration.
		preact({ include: ['**/preact/*'] }),
		react({ include: ['**/react/*'] }),
	],
});
