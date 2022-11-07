import { defineConfig } from 'astro/config';
import deno from '@astrojs/deno';
import image from '@astrojs/image';

export default defineConfig({
	adapter: deno(),
	integrations: [image()],
	output: 'server',
})
