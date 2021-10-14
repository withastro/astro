import { svelte } from '@sveltejs/vite-plugin-svelte';

export default {
  name: '@astrojs/renderer-svelte',
  client: './client.js',
  server: './server.js',
  vitePlugins: [
    svelte({
      emitCss: true,
      compilerOptions: { hydratable: true },
    }),
  ],
};
