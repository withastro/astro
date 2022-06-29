import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// https://astro.build/config
export default defineConfig({
	integrations: [preact()],
  vite: {
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/js/[name].js`,
        },
      },
    },
  },
});
