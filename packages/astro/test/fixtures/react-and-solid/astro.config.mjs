import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import solid from '@astrojs/solid-js';

export default defineConfig({
	integrations: [react(), solid()]
});
