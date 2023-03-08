import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';

// https://astro.build/config
export default defineConfig({
	integrations: [
		markdoc({
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
