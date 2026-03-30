import mdx from '@astrojs/mdx';
// TODO: Re-enable once Svelte is compatible with Vite v8
// import svelte from '@astrojs/svelte';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [/* svelte(), */ mdx()],
});
