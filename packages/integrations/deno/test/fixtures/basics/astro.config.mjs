import { defineConfig } from 'astro/config';
import deno from '@astrojs/deno';
import react from '@astrojs/react';

export default defineConfig({
	adapter: deno(),
	integrations: [react()],
	output: 'server',
})
