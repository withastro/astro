import { defineConfig } from 'astro/config';
import deno from '@astrojs/deno';

export default defineConfig({
	deploy: deno(),
	output: 'server',
})
