import mdx from '@astrojs/mdx';

export default {
	integrations: [mdx({
		optimize: {
			customComponentNames: ['strong']
		}
	})]
}
