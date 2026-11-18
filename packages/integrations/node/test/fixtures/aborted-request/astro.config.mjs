import { defineConfig, logHandlers } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	logger: logHandlers.json(),
});