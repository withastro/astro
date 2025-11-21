import { defineConfig } from 'astro/config';

export default defineConfig({
	svgo: {
		plugins: [
			'preset-default',
			{
				name: 'removeViewBox',
				active: false,
			},
		],
	},
});
