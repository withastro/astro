import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import deno from "@astrojs/deno";
import node from "@astrojs/node"
import image from "@astrojs/image"

// https://astro.build/config
export default defineConfig({
	output: 'server',
	// adapter: node({
	// 	mode: 'standalone',
	// }),
	adapter: deno(),
	integrations: [svelte(), image()],
});
