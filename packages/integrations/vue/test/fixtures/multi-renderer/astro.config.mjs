import react from '@astrojs/react';
import vue from '@astrojs/vue';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [
    react({ include: ['**/components/react/**'] }),
    vue(),
  ],
});
