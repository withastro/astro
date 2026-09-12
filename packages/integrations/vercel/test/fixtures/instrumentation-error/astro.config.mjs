import vercel from '@astrojs/vercel';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: vercel({ instrumentation: true }),
	output: 'server',
});
