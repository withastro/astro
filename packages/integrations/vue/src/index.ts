import path from 'node:path';
import type { Options as VueOptions } from '@vitejs/plugin-vue';
import vue from '@vitejs/plugin-vue';
import type { Options as VueJsxOptions } from '@vitejs/plugin-vue-jsx';
import type { AstroIntegration, AstroRenderer } from 'astro';
import type { Plugin, UserConfig } from 'vite';

interface Options extends VueOptions {
	jsx?: boolean | VueJsxOptions;
	appEntrypoint?: string;
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

function virtualAppEntrypoint(options?: Options): Plugin {
	const virtualModuleId = 'virtual:@astrojs/vue/app';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;

	let isBuild: boolean;
	let root: string;

	return {
		name: '@astrojs/vue/virtual-app',
		config(_, { command }) {
			isBuild = command === 'build';
		},
		configResolved(config) {
			root = config.root;
		},
		resolveId(id: string) {
			if (id == virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id: string) {
			if (id === resolvedVirtualModuleId) {
				if (options?.appEntrypoint) {
					const appEntrypoint = options.appEntrypoint.startsWith('.')
						? path.resolve(root, options.appEntrypoint)
						: options.appEntrypoint;

					return `\
import * as mod from "${appEntrypoint}";
						
export const setup = (app) => {
	if ('default' in mod) {
		mod.default(app);
	} else {
		${
			!isBuild
				? `console.warn("[@astrojs/vue] appEntrypoint \`${appEntrypoint}\` does not export a default function. Check out https://docs.astro.build/en/guides/integrations-guide/vue/#appentrypoint.");`
				: ''
		}
	}
}`;
				}
				return `export const setup = () => {};`;
			}
		},
	};
}

async function getViteConfiguration(options?: Options): Promise<UserConfig> {
	const config: UserConfig = {
		optimizeDeps: {
			include: ['@astrojs/vue/client.js', 'vue'],
			exclude: ['@astrojs/vue/server.js', 'virtual:@astrojs/vue/app'],
		},
		plugins: [vue(options), virtualAppEntrypoint(options)],
		ssr: {
			external: ['@vue/server-renderer'],
			noExternal: ['vuetify', 'vueperslides', 'primevue'],
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
