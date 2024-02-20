import mdx from '@astrojs/mdx';
import vue from '@astrojs/vue';
import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

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
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	experimental: {
		isIndependent: true,
	}
});
