import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import preact from '@astrojs/preact';
import solid from '@astrojs/solid-js';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
	integrations: [react(), preact(), solid(), svelte(), vue()],
});