import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	vite: {
		ssr: {
			noExternal: [
				'@fontsource/montserrat',
				'@fontsource/monofett',
			]
		}
	}
});
