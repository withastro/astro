import preact from '@astrojs/preact';
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [
		react({ include: ['**/react/*'] }),
		preact({ include: ['**/preact/*'] }),
		solid({ include: ['**/solid/*'] }),
		svelte(),
		vue(),
	],
});
