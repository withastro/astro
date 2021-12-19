import { svelte } from '@sveltejs/vite-plugin-svelte';
import preprocess from 'svelte-preprocess';

export default {
  name: '@astrojs/renderer-svelte',
  client: './client.js',
  server: './server.js',
  viteConfig({ mode }) {
    return {
      optimizeDeps: {
        include: ['@astrojs/renderer-svelte/client.js', 'svelte', 'svelte/internal'],
        exclude: ['@astrojs/renderer-svelte/server.js'],
      },
      plugins: [
        svelte({
          emitCss: true,
          compilerOptions: { dev: mode === 'development', hydratable: true },
          preprocess: [
            preprocess({
              less: true,
              sass: { renderSync: true },
              scss: { renderSync: true },
              postcss: true,
              stylus: true,
              typescript: true,
            }),
          ],
        }),
      ],
    };
  },
};
