import type { Options as VueOptions } from '@vitejs/plugin-vue';
import vue from '@vitejs/plugin-vue';
import type { Options as VueJsxOptions } from '@vitejs/plugin-vue-jsx';
import type { AstroIntegration, AstroIntegrationLogger, AstroRenderer } from 'astro';
import { init, parse } from 'es-module-lexer';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { UserConfig } from 'vite';

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
	return {
		name: '@astrojs/vue/virtual-app',
		resolveId(id: string) {
			if (id == virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		async load(id: string) {
			if (id === resolvedVirtualModuleId) {
				if (options.appEntrypoint) {
					const entrypoint = join(fileURLToPath(options.root), options.appEntrypoint);
					const dir = dirname(entrypoint);
					const filename = (await readdir(dir)).find((f) => f.startsWith('_app.'));
					if (!filename) {
						options.logger.warn(`appEntrypoint \`${options.appEntrypoint}\` does not exist.`);
						return `export const setup = () => {};`;
					}

					const path = join(dir, filename);
					const source = await readFile(path, 'utf-8');

					await init;
					const [, exports] = parse(source);

					if (!exports.some((e) => e.n === 'default')) {
						options.logger.warn(
							`appEntrypoint \`${options.appEntrypoint}\` does not export a default function. Check out https://docs.astro.build/en/guides/integrations-guide/vue/#appentrypoint.`
						);
						return `export const setup = () => {};`;
					}

					return `
						import * as virtualApp from "${options.appEntrypoint}";
						export const setup = virtualApp.default ?? (() => {});
					`;
				}
				return `export const setup = () => {};`;
			}
		},
	};
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
