import {
	Connection,
	LanguagePlugin,
	MessageType,
	ShowMessageNotification,
	VirtualCode,
} from '@volar/language-server/node';
import { URI } from 'vscode-uri';
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

import type { ServerOptions } from '@volar/language-server/lib/server.js';
import { create as createAstroService } from './plugins/astro.js';
import { create as createHtmlService } from './plugins/html.js';
import { create as createTypescriptAddonsService } from './plugins/typescript-addons/index.js';
import { create as createTypeScriptServices } from './plugins/typescript/index.js';

export function createServerOptions(
	connection: Connection,
	ts: typeof import('typescript')
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
		getServicePlugins() {
			return [
				createHtmlService(),
				createCssService(),
				createEmmetService(),
				...createTypeScriptServices(ts),
				createTypeScriptTwoSlashService(ts),
				createTypescriptAddonsService(),
				createAstroService(ts),
				getPrettierService(),
			];
		},
		getLanguagePlugins(serviceEnv, projectContext) {
			const languagePlugins: LanguagePlugin<VirtualCode>[] = [
				getVueLanguageModule(),
				getSvelteLanguageModule(),
			];

			if (projectContext.typescript) {
				const rootPath = projectContext.typescript.configFileName
					? projectContext.typescript.configFileName.split('/').slice(0, -1).join('/')
					: serviceEnv.typescript!.uriToFileName(serviceEnv.workspaceFolder);
				const nearestPackageJson = ts.findConfigFile(rootPath, ts.sys.fileExists, 'package.json');

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

			return languagePlugins;
		},
	};

	function getPrettierService() {
		let prettier: ReturnType<typeof importPrettier>;
		let prettierPluginPath: ReturnType<typeof getPrettierPluginPath>;
		return createPrettierService(
			context => {
				const workspaceUri = URI.parse(context.env.workspaceFolder);
				if (workspaceUri.scheme === 'file') {
					prettier = importPrettier(workspaceUri.fsPath);
					prettierPluginPath = getPrettierPluginPath(workspaceUri.fsPath);
					if (!prettier || !prettierPluginPath) {
						connection.sendNotification(ShowMessageNotification.type, {
							message:
								"Couldn't load `prettier` or `prettier-plugin-astro`. Formatting will not work. Please make sure those two packages are installed into your project.",
							type: MessageType.Warning,
						});
					}
					return prettier;
				}
			},
			{
				documentSelector: ['astro'],
				getFormattingOptions: async (prettier, document, formatOptions, context) => {
					const filePath = URI.parse(document.uri).fsPath;
					const configOptions = await prettier.resolveConfig(filePath, {
						// This seems to be broken since Prettier 3, and it'll always use its cumbersome cache. Hopefully it works one day.
						useCache: false,
					});
					const editorOptions = await context.env.getConfiguration<{}>?.('prettier', document.uri);

					// Return a config with the following cascade:
					// - Prettier config file should always win if it exists, if it doesn't:
					// - Prettier config from the VS Code extension is used, if it doesn't exist:
					// - Use the editor's basic configuration settings
					const resolvedConfig = {
						filepath: filePath,
						tabWidth: formatOptions.tabSize,
						useTabs: !formatOptions.insertSpaces,
						...editorOptions,
						...configOptions,
					};

					return {
						...resolvedConfig,
						plugins: [
							...await getAstroPrettierPlugin(),
							...resolvedConfig.plugins ?? [],
						],
						parser: 'astro',
					};

					async function getAstroPrettierPlugin() {
						if (!prettier || !prettierPluginPath) {
							return [];
						}

						const hasPluginLoadedAlready =
							(await prettier.getSupportInfo()).languages.some((l: any) => l.name === 'astro') ||
							resolvedConfig.plugins?.includes('prettier-plugin-astro'); // getSupportInfo doesn't seems to work very well in Prettier 3 for plugins

						return hasPluginLoadedAlready ? [] : [prettierPluginPath];
					}
				},
			});
	}
}
