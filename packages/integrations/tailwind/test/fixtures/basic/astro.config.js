// @ts-check
import tailwind from '@astrojs/tailwind';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    tailwind({
      // applyBaseStyles: false,
      configFile: "./tailwind.config.js"
    }),
  ]
});
