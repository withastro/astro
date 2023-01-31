import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import react from '@astrojs/react';
import svelte from '@astrojs/svelte';

export default defineConfig({
	integrations: [preact(), react(), svelte()],
})
