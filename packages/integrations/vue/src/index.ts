import type { Options as VueOptions } from '@vitejs/plugin-vue';
import vue from '@vitejs/plugin-vue';
import type { Options as VueJsxOptions } from '@vitejs/plugin-vue-jsx';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type { UserConfig } from 'vite';

interface Options extends VueOptions {
	jsx?: boolean | VueJsxOptions;
}

function getRenderer(): AstroRenderer {
	return {
		name: '@astrojs/vue',
		clientEntrypoint: '@astrojs/vue/client.js',
		serverEntrypoint: '@astrojs/vue/server.js',
	};
}

function getJsxRenderer(): AstroRenderer {
	return {
		name: '@astrojs/vue (jsx)',
		clientEntrypoint: '@astrojs/vue/client.js',
		serverEntrypoint: '@astrojs/vue/server.js',
		jsxImportSource: 'vue',
		jsxTransformOptions: async () => {
			const jsxPlugin = (await import('@vue/babel-plugin-jsx')).default;
			return {
				plugins: [jsxPlugin],
			};
		},
	};
}

async function getViteConfiguration(options?: Options): Promise<UserConfig> {
	const config: UserConfig = {
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

	if (options?.jsx) {
		const vueJsx = (await import('@vitejs/plugin-vue-jsx')).default;
		const jsxOptions = typeof options.jsx === 'object' ? options.jsx : undefined;
		config.plugins?.push(vueJsx(jsxOptions));
	}

	return config;
}

export default function (options?: Options): AstroIntegration {
	return {
		name: '@astrojs/vue',
		hooks: {
			'astro:config:setup': async ({ addRenderer, updateConfig }) => {
				addRenderer(getRenderer());
				if (options?.jsx) {
					addRenderer(getJsxRenderer());
				}
				updateConfig({ vite: await getViteConfiguration(options) });
			},
		},
	};
}
