import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react({ experimentalReactChildren: true })],
  // Keeps the whitespace written between children, which the default `'jsx'` mode removes
  compressHTML: false,
});
