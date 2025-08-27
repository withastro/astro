// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
	experimental: {
		csp: {
			directives: ["font-src 'self' https://fonts.cdn.test.com"]
		},
		fonts: [
			{
				name: 'Roboto',
				cssVariable: '--font-roboto',
				provider: 'local',
				variants: [
					{
						weight: 400,
						style: 'normal',
						src: ['./src/fonts/roboto-normal-400.woff2'],
					},
				],
				optimizedFallbacks: false,
			},
		],
	},
});
