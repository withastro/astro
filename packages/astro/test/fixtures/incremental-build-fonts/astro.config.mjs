// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
	fonts: [
		{
			name: 'Roboto',
			cssVariable: '--font-roboto',
			provider: fontProviders.local(),
			options: {
				variants: [
					{
						weight: 400,
						style: 'normal',
						src: ['./src/fonts/roboto-normal-400.woff2'],
					},
				],
			},
			optimizedFallbacks: false,
		},
	],
});
