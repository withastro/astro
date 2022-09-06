import type { Options } from '@vitejs/plugin-vue';
import vue from '@vitejs/plugin-vue';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type { UserConfig } from 'vite';

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/vue',
		clientEntrypoint: '@astrojs/vue/client.js',
		serverEntrypoint: '@astrojs/vue/server.js',
	};
}

function getViteConfiguration(options?: Options): UserConfig {
	return {
		optimizeDeps: {
			include: ['@astrojs/vue/client.js', 'vue'],
			exclude: ['@astrojs/vue/server.js'],
		},
		plugins: [vue(options)],
		ssr: {
			external: ['@vue/server-renderer'],
			noExternal: ['vueperslides'],
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
