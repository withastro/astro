import node from '@astrojs/node'

export default {
	output: 'server',
	adapter: node({
		staticHeaders: true
	}),
	security: {
		csp: true
	}
};
