import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: 'Roboto',
			cssVariable: '--font-test',
			weights: [700],
		},
	],
});
