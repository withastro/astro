import { defineConfig } from 'astro/config';
import renderer from 'astro/jsx/renderer.js';

export default defineConfig({
	integrations: [
		{
			name: '@astrojs/test-jsx',
			hooks: {
				'astro:config:setup': ({ addRenderer }) => {
					addRenderer(renderer);
				}
			}
		}
	]
})
