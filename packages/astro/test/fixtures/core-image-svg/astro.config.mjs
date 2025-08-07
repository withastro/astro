import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

import preact from '@astrojs/preact';

export default defineConfig({
  integrations: [mdx(), preact()],
});