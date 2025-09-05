import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  base: '/mybase',
  trailingSlash: 'never',
  output: 'server',
  adapter: node({ mode: 'standalone' })
});