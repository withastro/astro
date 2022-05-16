import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
	integrations: [vue({
		template: {
			compilerOptions: {
				isCustomElement: tag => tag.includes('my-button')
			}
		}
	})],
});
