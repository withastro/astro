import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import customElementRenderer from './src/renderer/index.mjs';

export default defineConfig({
	integrations: [mdx(), customElementRenderer()],
});
