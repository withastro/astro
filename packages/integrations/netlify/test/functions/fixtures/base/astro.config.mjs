import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

export default defineConfig({
  base: "/test",
  trailingSlash: "always",
  output: 'server',
  adapter: netlify(),
  site: `http://example.com`,
});