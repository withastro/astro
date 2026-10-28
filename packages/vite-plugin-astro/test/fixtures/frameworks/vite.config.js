import preact from '@astrojs/preact/renderer';
import react from '@astrojs/react/renderer';
import solid from '@astrojs/solid-js/renderer';
import svelte from '@astrojs/svelte/renderer';
import astro from '@astrojs/vite-plugin-astro';
import vue from '@astrojs/vue/renderer';
import { preact as vitePreact } from '@preact/preset-vite';
import { svelte as viteSvelte } from '@sveltejs/vite-plugin-svelte';
import viteReact from '@vitejs/plugin-react';
import viteVue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import viteSolid from 'vite-plugin-solid';

// One island per framework. The framework plugins come before and after `astro()`: renderers do not
// depend on plugin order. The three JSX frameworks split the components by directory.
// `@preact/preset-vite` limits its JSX transform to `include` only with Babel (`babel`), and must not
// alias `react` to `preact/compat`.
export default defineConfig({
	plugins: [
		viteSvelte(),
		vitePreact({ include: ['**/preact/*'], babel: {}, reactAliasesEnabled: false }),
		astro({
			renderers: [
				react({ include: ['**/react/*'] }),
				preact({ include: ['**/preact/*'] }),
				solid(),
				svelte(),
				vue(),
			],
		}),
		viteReact({ include: ['**/react/*'] }),
		viteSolid({ ssr: true, include: ['**/solid/*'] }),
		viteVue(),
	],
	environments: {
		ssr: {
			build: { outDir: 'dist/server', rolldownOptions: { input: { render: 'src/render.js' } } },
		},
		client: { build: { outDir: 'dist/client' } },
	},
});
