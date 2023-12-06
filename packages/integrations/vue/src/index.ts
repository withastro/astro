import type { Options as VueOptions } from '@vitejs/plugin-vue';
import type { Options as VueJsxOptions } from '@vitejs/plugin-vue-jsx';
import type { AstroIntegration, AstroIntegrationLogger, AstroRenderer } from 'astro';
import type { UserConfig, Plugin } from 'vite';

import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';

interface Options extends VueOptions {
	jsx?: boolean | VueJsxOptions;
	appEntrypoint?: string;
}

interface ViteOptions extends Options {
	root: URL;
	logger: AstroIntegrationLogger;
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

function virtualAppEntrypoint(options: ViteOptions) {
	const virtualModuleId = 'virtual:@astrojs/vue/app';
	const resolvedVirtualModuleId = '\0' + virtualModuleId;
	let getExports: (id: string) => Promise<string[]>;
	return {
		name: '@astrojs/vue/virtual-app',
		buildStart() {
			if (!getExports) {
				getExports = async (id: string) => {
					const info = await this.load.call(this, { id });
					return info.exports ?? [];
				};
			}
		},
		configureServer(server) {
			if (!getExports) {
				getExports = async (id: string) => {
					const mod = await server.ssrLoadModule(id);
					return Object.keys(mod) ?? [];
				};
			}
		},
		resolveId(id: string) {
			if (id == virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		async load(id: string) {
			const noop = `export const setup = (app) => app;`;
			if (id === resolvedVirtualModuleId) {
				if (options.appEntrypoint) {
					try {
						let resolved;
						if (options.appEntrypoint.startsWith('.')) {
							resolved = await this.resolve(
								fileURLToPath(new URL(options.appEntrypoint, options.root))
							);
						} else {
							resolved = await this.resolve(options.appEntrypoint, fileURLToPath(options.root));
						}
						if (!resolved) {
							// This error is handled below, the message isn't shown to the user
							throw new Error('Unable to resolve appEntrypoint');
						}
						const exports = await getExports(resolved.id);
						if (!exports.includes('default')) {
							options.logger.warn(
								`appEntrypoint \`${options.appEntrypoint}\` does not export a default function. Check out https://docs.astro.build/en/guides/integrations-guide/vue/#appentrypoint.`
							);
							return noop;
						}
						return `export { default as setup } from "${resolved.id}";`;
					} catch {
						options.logger.warn(
							`Unable to resolve appEntrypoint \`${options.appEntrypoint}\`. Does the file exist?`
						);
					}
				}
				return noop;
			}
		},
	} satisfies Plugin;
}

async function getViteConfiguration(options: ViteOptions): Promise<UserConfig> {
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
			'astro:config:setup': async ({ addRenderer, updateConfig, config, logger }) => {
				addRenderer(getRenderer());
				if (options?.jsx) {
					addRenderer(getJsxRenderer());
				}
				updateConfig({
					vite: await getViteConfiguration({ ...options, root: config.root, logger }),
				});
			},
		},
	};
}
