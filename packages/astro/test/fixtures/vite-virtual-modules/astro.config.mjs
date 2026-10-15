import { defineConfig } from 'astro/config';
import virtual from './src/plugins/virtual.js';

export default defineConfig({
	vite: {
		plugins: [virtual],
	},
});
