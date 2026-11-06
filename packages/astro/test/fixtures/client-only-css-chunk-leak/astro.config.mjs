import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  build: { inlineStylesheets: 'never' },
  vite: {
    build: {
      rollupOptions: {
        output: {
          // Force StyledPanel (which imports CSS) and formatLabel (a pure utility)
          // into the same chunk. This simulates what Rollup's default heuristics
          // do naturally in large apps.
          manualChunks(id) {
            if (id.includes('StyledPanel') || id.includes('formatLabel')) {
              return 'shared-utils';
            }
          },
        },
      },
    },
  },
});
