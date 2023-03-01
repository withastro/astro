import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';

// https://astro.build/config
export default defineConfig({
	integrations: [
		markdoc({
			variables: {
				revealSecret: true,
			},
			tags: {
				aside: {
					render: 'Aside',
					attributes: {
						type: { type: String },
						title: { type: String },
					},
				},
			},
		}),
	],
});
