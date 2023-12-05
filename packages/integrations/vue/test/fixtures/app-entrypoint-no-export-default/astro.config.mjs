import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';
import ViteSvgLoader from 'vite-svg-loader'

export default defineConfig({
  integrations: [vue({
		appEntrypoint: '/src/pages/_app'
	})],
	vite: {
    plugins: [
      ViteSvgLoader(),
    ],
	},
})
