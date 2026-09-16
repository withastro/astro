import { defineConfig } from 'astro/config';

export default defineConfig({
  build: {
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      target: ["safari15"],
      minify: false,
    },
  },
});
