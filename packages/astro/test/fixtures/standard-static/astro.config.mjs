import preact from '@astrojs/preact';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [
		preact({
			include: [
				'**/preact-component/*.{jsx,tsx}',
				'**/expr/*.jsx',
				'**/children/Component.jsx',
				'**/children/NoRender.jsx',
				'**/hydration-race/*.jsx',
				'**/fetch-test/JsxComponent.jsx',
				'**/reexport-client/**/*.jsx',
			],
		}),
		vue({
			include: ['**/children/Component.vue', '**/fetch-test/VueComponent.vue'],
		}),
		svelte(),
	],
	build: {
		inlineStylesheets: 'never',
	},
});
