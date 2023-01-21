import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
	integrations: [
		mdx(),
		vue({
			template: {
				compilerOptions: {
					isCustomElement: tag => tag.includes('my-button')
				}
			}
		}
	)],
});
