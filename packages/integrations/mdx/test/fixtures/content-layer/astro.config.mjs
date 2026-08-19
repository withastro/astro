import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  integrations: [mdx()],
  image: {
    service: {
      entrypoint: 'astro/assets/services/noop'
    }
  },
	vite: {
		resolve: {
			alias: {
				'@images': fileURLToPath(new URL('./images', import.meta.url))
			}
		},
	},
});
