import {
	Connection,
	LanguagePlugin,
	MessageType,
	ServiceEnvironment,
	ServicePlugin,
	ShowMessageNotification,
	VirtualFile,
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

import type { createServer, ServerOptions } from '@volar/language-server/lib/server.js';
import { create as createAstroService } from './plugins/astro.js';
import { create as createHtmlService } from './plugins/html.js';
import { create as createTypescriptAddonsService } from './plugins/typescript-addons/index.js';
import { create as createTypeScriptService } from './plugins/typescript/index.js';

export function createServerOptions(
	connection: Connection,
	server: ReturnType<typeof createServer>
): ServerOptions {
	return {
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
		getServerCapabilitiesSetup() {
			const ts = getTypeScriptModule();
			const servicePlugins: ServicePlugin[] = [
				createHtmlService(),
				createCssService(),
				createEmmetService(),
				createTypeScriptService(ts),
				createTypeScriptTwoSlashService(),
				createTypescriptAddonsService(),
				createAstroService(ts),
			];

			return {
				servicePlugins: servicePlugins,
			};
		},
		getProjectSetup(serviceEnv, projectContext) {
			const ts = getTypeScriptModule();
			const servicePlugins: ServicePlugin[] = [
				createHtmlService(),
				createCssService(),
				createEmmetService(),
				createTypeScriptService(ts),
				createTypeScriptTwoSlashService(),
				createTypescriptAddonsService(),
				createAstroService(ts),
			];

			const languagePlugins: LanguagePlugin<VirtualFile>[] = [
				getVueLanguageModule(),
				getSvelteLanguageModule(),
			];

			if (serviceEnv && projectContext?.typescript) {
				const rootPath = projectContext.typescript.configFileName
					? projectContext.typescript.configFileName.split('/').slice(0, -1).join('/')
					: serviceEnv.uriToFileName(serviceEnv.workspaceFolder.uri.toString());
				const nearestPackageJson = server.modules.typescript?.findConfigFile(
					rootPath,
					ts.sys.fileExists,
					'package.json'
				);

				const astroInstall = getAstroInstall([rootPath], {
					nearestPackageJson: nearestPackageJson,
					readDirectory: ts.sys.readDirectory,
				});

				if (astroInstall === 'not-found') {
					connection.sendNotification(ShowMessageNotification.type, {
						message: `Couldn't find Astro in workspace "${rootPath}". Experience might be degraded. For the best experience, please make sure Astro is installed into your project and restart the language server.`,
						type: MessageType.Warning,
					});
				}

				languagePlugins.unshift(
					getLanguageModule(typeof astroInstall === 'string' ? undefined : astroInstall, ts)
				);
			}
			const prettierService = getPrettierService(serviceEnv);

			return {
				languagePlugins: languagePlugins,
				servicePlugins: [...servicePlugins, ...(prettierService ? [prettierService] : [])],
			};
		},
	};

	function getTypeScriptModule() {
		const tsModule = server.modules.typescript;
		if (!tsModule) {
			throw new Error('TypeScript module is missing');
		}
		return tsModule;
	}

	function getPrettierService(env: ServiceEnvironment) {
		const workspacePath = env.uriToFileName(env.workspaceFolder.uri.toString());
		const prettier = importPrettier(workspacePath);
		const prettierPluginPath = getPrettierPluginPath(workspacePath);

		if (prettier && prettierPluginPath) {
			return createPrettierService({
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
							(await prettier.getSupportInfo()).languages.some((l: any) => l.name === 'astro') ||
							resolvedConfig.plugins?.includes('prettier-plugin-astro'); // getSupportInfo doesn't seems to work very well in Prettier 3 for plugins

						return hasPluginLoadedAlready ? [] : [prettierPluginPath];
					}

					const plugins = [...(await getAstroPrettierPlugin()), ...(resolvedConfig.plugins ?? [])];

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
}
