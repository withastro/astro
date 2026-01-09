import { defineConfig } from 'astro/config';

export default defineConfig({
	build: {
    format: 'file',
  },
  output: 'static',
  trailingSlash: 'never',
});