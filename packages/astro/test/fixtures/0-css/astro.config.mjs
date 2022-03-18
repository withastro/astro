import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
    integrations: [react(), svelte(), vue()],
    vite: {
        build: {
            assetsInlineLimit: 0,
        },
    },
});

