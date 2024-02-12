import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';
import renderer from 'astro/jsx/renderer.js';


export default defineConfig({
	integrations: [
		preact({
			include: ['**/preact/*']
		}),
		react({
			include: ['**/react/*']
		}),
		solid({
			include: ['**/solid/*'],
		}),
		mdx(),
		svelte(),
		vue(),
		{
			name: '@astrojs/test-jsx',
			hooks: {
				'astro:config:setup': ({ addRenderer }) => {
					addRenderer(renderer);
				}
			}
		},
	]
})
