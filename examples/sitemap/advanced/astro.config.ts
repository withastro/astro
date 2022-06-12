import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import sitemapConfig from './sitemap.config';

// https://astro.build/config
export default defineConfig({
  integrations: [sitemap(sitemapConfig)],
});
