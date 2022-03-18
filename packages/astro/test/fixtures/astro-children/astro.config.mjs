import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import vue from '@astrojs/vue';
import svelte from '@astrojs/svelte';

// https://astro.build/config
export default defineConfig({
	integrations: [preact(), vue(), svelte()],
});
