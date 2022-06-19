import { defineConfig } from 'astro/config';
import image from '@astrojs/image';
import netlify from '@astrojs/netlify/functions';

// https://astro.build/config
export default defineConfig({
	site: 'http://localhost:3000',
	integrations: [image()],
	adapter: netlify(),
});
