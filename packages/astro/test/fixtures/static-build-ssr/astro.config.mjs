import { defineConfig } from 'astro/config';
import nodejs from '@astrojs/node';

export default defineConfig({
	deploy: nodejs(),
	output: 'server',
});
