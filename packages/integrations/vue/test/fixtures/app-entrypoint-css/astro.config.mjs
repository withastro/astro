import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

export default defineConfig({
  fetchFile: null,
  integrations: [
    vue({ appEntrypoint: '/src/app.ts' })
  ],
})
