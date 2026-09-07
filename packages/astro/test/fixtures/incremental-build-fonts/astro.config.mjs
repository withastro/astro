import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
	experimental: {
		incrementalBuild: true,
	},
	fonts: [
		{
			provider: fontProviders.google(),
			name: 'Roboto',
			cssVariable: '--font-test',
		},
	],
});
