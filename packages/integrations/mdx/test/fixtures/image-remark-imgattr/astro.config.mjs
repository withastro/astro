import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import plugin from "./remarkPlugin"

// https://astro.build/config
export default defineConfig({
	integrations: [mdx({remarkPlugins:[plugin]})],
});
