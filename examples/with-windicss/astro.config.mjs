import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import windi from '@astrojs/windi';

// https://astro.build/config
export default defineConfig({
	integrations: [mdx(), windi()],
});
