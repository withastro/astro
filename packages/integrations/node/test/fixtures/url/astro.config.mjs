import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
	output: 'server',
	adapter: node(),
	security: {
		allowedDomains: [
			{
				hostname: 'abc.xyz',
				port: '444'
			}
		]
	}
});