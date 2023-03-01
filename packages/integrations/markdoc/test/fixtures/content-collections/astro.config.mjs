import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';

// https://astro.build/config
export default defineConfig({
	integrations: [markdoc({
		variables: {
			showMarquee: true,
		},
		tags: {
			mq: {
				render: 'marquee',
				attributes: {
					direction: {
						type: String,
						default: 'left',
						matches: ['left', 'right', 'up', 'down'],
						errorLevel: 'critical',
					},
				},
			},
		}
	})],
});
