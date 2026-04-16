import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
		svgo: {
			plugins: [
				'preset-default',
				{
					name: 'removeViewBox',
					active: false,
				},
			],
		},
	},
});
