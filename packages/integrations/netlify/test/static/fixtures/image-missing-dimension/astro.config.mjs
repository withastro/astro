import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  adapter: netlify(),
  output: 'static',
  image: {
    domains: ['images.unsplash.com'],
    service: {
      entrypoint: 'astro/assets/services/sharp'
    }
  }
});
