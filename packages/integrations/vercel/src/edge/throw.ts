const msg = `
The Astro Vercel Edge adapter has been removed. We recommend switching to @astrojs/vercel/serverless and enabling Edge middleware.

import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
	output: 'server',
	adapter: vercel({
		edgeMiddleware: true,
	})
})
`.trim();

throw new Error(msg);

// Make sure bundlers treat this as ESM.
export default {};
