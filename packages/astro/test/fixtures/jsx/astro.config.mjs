import { defineConfig } from 'astro/config';
import renderer from 'astro/jsx/renderer.js';
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import solid from '@astrojs/solid-js';

export default defineConfig({
	integrations: [
		{
			name: '@astrojs/test-jsx',
			hooks: {
				'astro:config:setup': ({ addRenderer }) => {
					addRenderer(renderer);
				}
			}
		},
		preact(),
		react(),
		svelte(),
		vue(),
		solid(),
	]
})
