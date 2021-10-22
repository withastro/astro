import { svelte } from '@sveltejs/vite-plugin-svelte';

export default {
  name: '@astrojs/renderer-svelte',
  client: './client.js',
  server: './server.js',
  viteConfig() {
    return {
      optimizeDeps: {
        include: ['@astrojs/renderer-svelte/client.js', 'svelte', 'svelte/internal'],
      },
      plugins: [
        svelte({
          emitCss: true,
          compilerOptions: { hydratable: true },
        }),
      ],
    };
  },
};
