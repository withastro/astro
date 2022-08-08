import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { rehypeReadingTime, remarkTitle } from './src/markdown-plugins.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://astro.build/',
	integrations: [mdx({
		remarkPlugins: [remarkTitle],
		rehypePlugins: [rehypeReadingTime],
	})],
});
