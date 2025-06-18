import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  build: {
    inlineStylesheets: 'never'
  }
});