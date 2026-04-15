import { defineConfig, svgoOptimizer } from 'astro/config';

export default defineConfig({
	experimental: {
		svgOptimizer: svgoOptimizer({
			plugins: [
				'preset-default',
				{
					name: 'removeViewBox',
					active: false,
				},
			],
		}),
	},
});
