import {
	Connection,
	MessageType,
	ShowMessageNotification,
	ServerPlugin,
} from '@volar/language-server/node';
import { getLanguageModule } from './core';
import { getSvelteLanguageModule } from './core/svelte.js';
import { getVueLanguageModule } from './core/vue.js';
import { getPrettierPluginPath, importPrettier } from './importPackage.js';
import { getAstroInstall } from './utils.js';

// Services
import { create as createCssService } from 'volar-service-css';
import { create as createEmmetService } from 'volar-service-emmet';
import { create as createPrettierService } from 'volar-service-prettier';
import { create as createTypeScriptTwoSlashService } from 'volar-service-typescript-twoslash-queries';

import { create as createAstroService } from './plugins/astro.js';
import { create as createHtmlService } from './plugins/html.js';
import { create as createTypescriptAddonsService } from './plugins/typescript-addons/index.js';
import { create as createTypeScriptService } from './plugins/typescript/index.js';

export function createPlugin(connection: Connection): ServerPlugin {
	return ({ modules }): ReturnType<ServerPlugin> => ({
		typescript: {
			extraFileExtensions: [
				{ extension: 'astro', isMixedContent: true, scriptKind: 7 },
				{ extension: 'vue', isMixedContent: true, scriptKind: 7 },
				{ extension: 'svelte', isMixedContent: true, scriptKind: 7 },
			],
		},
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
		resolveConfig(config, env, projectContext) {
			config.languages ??= {};
			if (env && projectContext?.typescript) {
				const rootPath = projectContext.typescript.configFileName
					? projectContext.typescript.configFileName.split('/').slice(0, -1).join('/')
					: env.uriToFileName(env.workspaceFolder.uri.toString());
				const nearestPackageJson = modules.typescript?.findConfigFile(
					rootPath,
					modules.typescript.sys.fileExists,
					'package.json'
				);

				const astroInstall = getAstroInstall([rootPath], {
					nearestPackageJson: nearestPackageJson,
					readDirectory: modules.typescript!.sys.readDirectory,
				});

				if (astroInstall === 'not-found') {
					connection.sendNotification(ShowMessageNotification.type, {
						message: `Couldn't find Astro in workspace "${rootPath}". Experience might be degraded. For the best experience, please make sure Astro is installed into your project and restart the language server.`,
						type: MessageType.Warning,
					});
				}

				config.languages.astro = getLanguageModule(
					typeof astroInstall === 'string' ? undefined : astroInstall,
					modules.typescript!
				);
				config.languages.vue = getVueLanguageModule();
				config.languages.svelte = getSvelteLanguageModule();
			}

			config.services ??= {};
			config.services.html ??= createHtmlService();
			config.services.css ??= createCssService();
			config.services.emmet ??= createEmmetService();
			config.services.typescript ??= createTypeScriptService(modules.typescript!);
			config.services.typescripttwoslash ??= createTypeScriptTwoSlashService();
			config.services.typescriptaddons ??= createTypescriptAddonsService();
			config.services.astro ??= createAstroService(modules.typescript!);

			if (env) {
				const workspacePath = env.uriToFileName(env.workspaceFolder.uri.toString());
				const prettier = importPrettier(workspacePath);
				const prettierPluginPath = getPrettierPluginPath(workspacePath);

				if (prettier && prettierPluginPath) {
					config.services.prettier ??= createPrettierService({
						prettier: prettier,
						languages: ['astro'],
						ignoreIdeOptions: true,
						useIdeOptionsFallback: true,
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
									(await prettier.getSupportInfo()).languages.some(
										(l: any) => l.name === 'astro'
									) || resolvedConfig.plugins?.includes('prettier-plugin-astro'); // getSupportInfo doesn't seems to work very well in Prettier 3 for plugins

								return hasPluginLoadedAlready ? [] : [prettierPluginPath];
							}

							const plugins = [
								...(await getAstroPrettierPlugin()),
								...(resolvedConfig.plugins ?? []),
							];

							return {
								...resolvedConfig,
								plugins: plugins,
								parser: 'astro',
							};
						},
					});
				} else {
					connection.sendNotification(ShowMessageNotification.type, {
						message:
							"Couldn't load `prettier` or `prettier-plugin-astro`. Formatting will not work. Please make sure those two packages are installed into your project.",
						type: MessageType.Warning,
					});
				}
			}

			return config;
		},
	});
}
