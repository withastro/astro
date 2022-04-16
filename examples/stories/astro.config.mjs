import { defineConfig } from 'astro/config';
import stories from '@astrojs/stories';
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';
import solid from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
		integrations: [preact(), react(), svelte(), vue(), solid(), stories()]
});
