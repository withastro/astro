import type { Options } from '@vitejs/plugin-vue';
import vue from '@vitejs/plugin-vue';
import type { AstroIntegration, AstroRenderer } from 'astro';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/vue',
		clientEntrypoint: '@astrojs/vue/client.js',
		serverEntrypoint: '@astrojs/vue/server.js',
	};
}

function getViteConfiguration(options?: Options) {
	return {
		optimizeDeps: {
			include: ['@astrojs/vue/client.js', 'vue'],
			exclude: ['@astrojs/vue/server.js'],
		},
		plugins: [vue(options)],
		ssr: {
			external: ['@vue/server-renderer'],
		},
	};
}

export default function (options?: Options): AstroIntegration {
	return {
		name: '@astrojs/vue',
		hooks: {
			'astro:config:setup': ({ addRenderer, updateConfig }) => {
				addRenderer(getRenderer());
				updateConfig({ vite: getViteConfiguration(options) });
			},
		},
	};
}
