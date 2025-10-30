import { defineConfig } from 'astro/config';
import nodejs from '@astrojs/node';

export default defineConfig({
	output: 'server',
	adapter: nodejs({ mode: 'standalone' }),
	security: {
		allowedDomains: [
			{
				hostname: 'abc.xyz'
			}
		]
	}
});