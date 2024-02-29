import mdx from '@astrojs/mdx';
import markdoc from '@astrojs/markdoc';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [mdx(), markdoc()],
});
