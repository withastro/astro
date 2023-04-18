import mdx from '@astrojs/mdx';

export default {
	integrations: [mdx()],
	experimental: {
		assets: true
	}
}
