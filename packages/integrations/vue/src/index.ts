import path from 'node:path';
import type { Options as VueOptions } from '@vitejs/plugin-vue';
import vue from '@vitejs/plugin-vue';
import type { Options as VueJsxOptions } from '@vitejs/plugin-vue-jsx';
import { MagicString } from '@vue/compiler-sfc';
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
	let appEntrypoint: string | undefined;

	return {
		name: '@astrojs/vue/virtual-app',
		config(_, { command }) {
			isBuild = command === 'build';
		},
		configResolved(config) {
			root = config.root;
			if (options?.appEntrypoint) {
				appEntrypoint = options.appEntrypoint.startsWith('.')
					? path.resolve(root, options.appEntrypoint)
					: options.appEntrypoint;
			}
		},
		resolveId(id: string) {
			if (id == virtualModuleId) {
				return resolvedVirtualModuleId;
			}
		},
		load(id: string) {
			if (id === resolvedVirtualModuleId) {
				if (appEntrypoint) {
					return `\
import * as mod from ${JSON.stringify(appEntrypoint)};

export const setup = async (app) => {
	if ('default' in mod) {
		await mod.default(app);
	} else {
		${
			!isBuild
				? `console.warn("[@astrojs/vue] appEntrypoint \`" + ${JSON.stringify(
						appEntrypoint
					)} + "\` does not export a default function. Check out https://docs.astro.build/en/guides/integrations-guide/vue/#appentrypoint.");`
				: ''
		}
	}
}`;
				}
				return `export const setup = () => {};`;
			}
		},
		// Ensure that Vue components reference appEntrypoint directly
		// This allows Astro to assosciate global styles imported in this file
		// with the pages they should be injected to
		transform(code, id) {
			if (!appEntrypoint) return;
			if (id.endsWith('.vue')) {
				const s = new MagicString(code);
				s.prepend(`import ${JSON.stringify(appEntrypoint)};\n`);
				return {
					code: s.toString(),
					map: s.generateMap({ hires: 'boundary' }),
				};
			}
		},
	};
}

async function getViteConfiguration(options?: Options): Promise<UserConfig> {
	let vueOptions = {
		...options,
		template: {
			...options?.template,
			transformAssetUrls: false,
		},
	} satisfies VueOptions;

	const config: UserConfig = {
		optimizeDeps: {
			include: ['@astrojs/vue/client.js', 'vue'],
			exclude: ['@astrojs/vue/server.js', 'virtual:@astrojs/vue/app'],
		},
		plugins: [vue(vueOptions), virtualAppEntrypoint(vueOptions)],
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
