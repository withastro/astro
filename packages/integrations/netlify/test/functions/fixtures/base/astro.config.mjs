import netlify from '@astrojs/netlify';
import { defineConfig } from 'astro/config';

export default defineConfig({
  base: "/test",
  trailingSlash: "always",
  output: 'server',
  adapter: netlify(),
  site: `http://example.com`,
});