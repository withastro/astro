import { svelte } from '@sveltejs/vite-plugin-svelte';

export default {
  name: '@astrojs/renderer-svelte',
  client: './client',
  server: './server',
  vitePlugins: [
    svelte({
      emitCss: true,
      compilerOptions: { hydratable: true },
    }),
  ],
};
