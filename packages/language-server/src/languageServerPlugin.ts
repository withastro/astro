import {
	LanguageServerPlugin,
	MessageType,
	ShowMessageNotification,
} from '@volar/language-server/node';
import createCssService from 'volar-service-css';
import createEmmetService from 'volar-service-emmet';
import createPrettierService from 'volar-service-prettier';
import createTypeScriptTwoSlashService from 'volar-service-typescript-twoslash-queries';
import { getLanguageModule } from './core';
import { getSvelteLanguageModule } from './core/svelte.js';
import { getVueLanguageModule } from './core/vue.js';
import { getPrettierPluginPath, importPrettier } from './importPackage.js';
import createAstroService from './plugins/astro.js';
import createHtmlService from './plugins/html.js';
import { createTypescriptAddonsService } from './plugins/typescript-addons/index.js';
import createTypeScriptService from './plugins/typescript/index.js';
import { getAstroInstall } from './utils.js';

export const plugin: LanguageServerPlugin = (
	initOptions,
	modules
): ReturnType<LanguageServerPlugin> => ({
	extraFileExtensions: [
		{ extension: 'astro', isMixedContent: true, scriptKind: 7 },
		{ extension: 'vue', isMixedContent: true, scriptKind: 7 },
		{ extension: 'svelte', isMixedContent: true, scriptKind: 7 },
	],
	watchFileExtensions: [
		'js',
		'cjs',
		'mjs',
		'ts',
		'cts',
		'mts',
		'jsx',
		'tsx',
		'json',
		'astro',
		'vue',
		'svelte',
	],
	resolveConfig(config, ctx) {
		config.languages ??= {};
		if (ctx) {
			const astroInstall = getAstroInstall([ctx.project.rootUri.fsPath]);

			if (!astroInstall) {
				ctx.server.connection.sendNotification(ShowMessageNotification.type, {
					message: `Couldn't find Astro in workspace "${ctx.project.rootUri.fsPath}". Experience might be degraded. For the best experience, please make sure Astro is installed into your project and restart the language server.`,
					type: MessageType.Warning,
				});
			}

			config.languages.astro = getLanguageModule(astroInstall, modules.typescript!);
			config.languages.vue = getVueLanguageModule();
			config.languages.svelte = getSvelteLanguageModule();
		}

		config.services ??= {};
		config.services.html ??= createHtmlService();
		config.services.css ??= createCssService();
		config.services.emmet ??= createEmmetService();
		config.services.typescript ??= createTypeScriptService();
		config.services.typescripttwoslash ??= createTypeScriptTwoSlashService();
		config.services.typescriptaddons ??= createTypescriptAddonsService();
		config.services.astro ??= createAstroService();

		if (ctx) {
			const rootDir = ctx.env.uriToFileName(ctx.project.rootUri.toString());
			const prettier = importPrettier(rootDir);
			const prettierPluginPath = getPrettierPluginPath(rootDir);

			if (prettier && prettierPluginPath) {
				config.services.prettier ??= createPrettierService({
					prettier: prettier,
					languages: ['astro'],
					ignoreIdeOptions: true,
					resolveConfigOptions: {
						// This seems to be broken since Prettier 3, and it'll always use its cumbersome cache. Hopefully it works one day.
						useCache: false,
					},
					additionalOptions: async (resolvedConfig) => {
						async function getAstroPrettierPlugin() {
							if (!prettier || !prettierPluginPath) {
								return [];
							}

							const hasPluginLoadedAlready =
								(await prettier.getSupportInfo()).languages.some((l: any) => l.name === 'astro') ||
								resolvedConfig.plugins?.includes('prettier-plugin-astro'); // getSupportInfo doesn't seems to work very well in Prettier 3 for plugins

							return hasPluginLoadedAlready ? [] : [prettierPluginPath];
						}

						const plugins = [
							...(await getAstroPrettierPlugin()),
							...(resolvedConfig.plugins ?? []),
						];

						return {
							plugins: plugins,
							parser: 'astro',
							...resolvedConfig,
						};
					},
				});
			} else {
				ctx.server.connection.sendNotification(ShowMessageNotification.type, {
					message:
						"Couldn't load `prettier` or `prettier-plugin-astro`. Formatting will not work. Please make sure those two packages are installed into your project.",
					type: MessageType.Warning,
				});
			}
		}

		return config;
	},
});
