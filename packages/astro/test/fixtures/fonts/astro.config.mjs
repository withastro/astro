import { defineConfig, fontProviders } from 'astro/config';

// https://astro.build/config
export default defineConfig({
    					experimental: {
						fonts: [
							{
								name: 'Roboto',
								cssVariable: '--font-roboto',
								provider: fontProviders.fontsource(),
							},
						],
					},
});
