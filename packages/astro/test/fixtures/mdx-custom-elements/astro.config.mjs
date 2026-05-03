import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';
import customElementRenderer from './src/custom-element-renderer/index.ts';

export default defineConfig({
	integrations: [customElementRenderer(), mdx()],
});
