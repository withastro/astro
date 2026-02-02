import node from '@astrojs/node'

export default {
	output: 'server',
	adapter: node({ 
		mode: 'standalone',
		experimentalStaticHeaders: true
	}),
	security: {
		csp: true
	}
};
