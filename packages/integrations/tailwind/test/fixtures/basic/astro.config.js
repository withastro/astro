import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [
    tailwind({
      configFile: fileURLToPath(new URL('./tailwind.config.js', import.meta.url)),
      nesting: true
    }),
  ]
});
