import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: netlify(),
	output: 'server',
});
