import { defineConfig } from 'astro/config';
import nodejs from '@astrojs/node';

export default defineConfig({
	output: 'server',
	adapter: nodejs({ mode: 'standalone' }),
	security: {
		allowedDomains: [
			{
				hostname: 'abc.xyz',
				port: '444'
			},
			{
				hostname: 'legitimate.example.com'
			},
			{
				hostname: 'localhost',
				port: '3000'
			}
		]
	}
});