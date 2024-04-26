import mdx from '@astrojs/mdx';

export default {
	integrations: [mdx({
		optimize: {
			ignoreComponentNames: ['strong']
		}
	})]
}
