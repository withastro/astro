import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import plugin from './remarkPlugin';

// https://astro.build/config
export default defineConfig({
	integrations: [mdx({ processor: unified({ remarkPlugins: [plugin] }) })],
});
