import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';

export default {
	integrations: [mdx({ optimize: true })],
	markdown: {
		processor: satteri(),
	},
};
