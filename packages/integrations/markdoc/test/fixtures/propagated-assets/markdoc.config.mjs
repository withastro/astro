import Aside from './src/components/Aside.astro';
import LogHello from './src/components/LogHello.astro';
import { defineMarkdocConfig } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
	tags: {
		aside: {
			render: Aside,
			attributes: {
				type: { type: String },
				title: { type: String },
			}
		},
		logHello: {
			render: LogHello,
		}
	},
})
