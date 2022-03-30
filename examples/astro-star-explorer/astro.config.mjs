import { defineConfig } from 'astro/config';
import svelte from "@astrojs/svelte";
import nodeAdapter from '@astrojs/node'

// https://astro.build/config
export default defineConfig({
  integrations: [svelte()],
  adapter: nodeAdapter(),
});