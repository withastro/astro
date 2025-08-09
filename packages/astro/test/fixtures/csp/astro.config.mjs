// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
	experimental: {
		csp: true,
		fonts: [
			{
				name: 'Roboto',
				cssVariable: '--font-roboto',
				provider: 'local',
				variants: [{
					weight: 400,
					style: 'normal',
					src: ['./src/fonts/roboto-normal-400.woff2']
				}]
			},
		],
	},
	integrations: [
		react()
	],
});
