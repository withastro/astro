import Code from './src/components/Code.astro';
import CustomMarquee from './src/components/CustomMarquee.astro';
import { defineMarkdocConfig } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
	nodes: {
		fence: {
			render: Code,
			attributes: {
				language: { type: String },
				content: { type: String },
			},
		},
	},
	tags: {
		mq: {
			render: CustomMarquee,
			attributes: {
				direction: {
					type: String,
					default: 'left',
					matches: ['left', 'right', 'up', 'down'],
					errorLevel: 'critical',
				},
			},
		},
	},
})
