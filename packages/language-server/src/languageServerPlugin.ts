import {
	Connection,
	LanguagePlugin,
	LanguageServiceEnvironment,
	MessageType,
	ShowMessageNotification,
} from '@volar/language-server/node';
import { URI } from 'vscode-uri';
import { getAstroLanguagePlugin } from './core';
import { getSvelteLanguagePlugin } from './core/svelte.js';
import { getVueLanguagePlugin } from './core/vue.js';
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
import { create as createTypeScriptServices } from './plugins/typescript/index.js';

export function getLanguagePlugins(
	connection: Connection,
	ts: typeof import('typescript'),
	serviceEnv: LanguageServiceEnvironment,
	tsconfig: string | undefined
) {
	const languagePlugins: LanguagePlugin<URI>[] = [
		getVueLanguagePlugin(),
		getSvelteLanguagePlugin(),
	];

	const rootPath = tsconfig
		? tsconfig.split('/').slice(0, -1).join('/')
		: serviceEnv.workspaceFolders[0]!.fsPath;
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
		getAstroLanguagePlugin(typeof astroInstall === 'string' ? undefined : astroInstall, ts)
	);

	return languagePlugins;
}

export function getLanguageServicePlugins(connection: Connection, ts: typeof import('typescript')) {
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
	function getPrettierService() {
		let prettier: ReturnType<typeof importPrettier>;
		let prettierPluginPath: ReturnType<typeof getPrettierPluginPath>;
		let hasShownNotification = false;

		return createPrettierService(
			(context) => {
				for (const workspaceFolder of context.env.workspaceFolders) {
					if (workspaceFolder.scheme === 'file') {
						prettier = importPrettier(workspaceFolder.fsPath);
						prettierPluginPath = getPrettierPluginPath(workspaceFolder.fsPath);
						if ((!prettier || !prettierPluginPath) && !hasShownNotification) {
							connection.sendNotification(ShowMessageNotification.type, {
								message:
									"Couldn't load `prettier` or `prettier-plugin-astro`. Formatting will not work. Please make sure those two packages are installed into your project and restart the language server.",
								type: MessageType.Warning,
							});
							hasShownNotification = true;
						}
						return prettier;
					}
				}
			},
			{
				documentSelector: ['astro'],
				getFormattingOptions: async (prettierInstance, document, formatOptions, context) => {
					const uri = URI.parse(document.uri);
					const documentUri = context.decodeEmbeddedDocumentUri(uri)?.[0] ?? uri;
					const filePath = documentUri.fsPath;

					if (!filePath) {
						return {};
					}

					let configOptions = null;
					try {
						configOptions = await prettierInstance.resolveConfig(filePath, {
							// This seems to be broken since Prettier 3, and it'll always use its cumbersome cache. Hopefully it works one day.
							useCache: false,
							editorconfig: true,
						});
					} catch (e) {
						connection.sendNotification(ShowMessageNotification.type, {
							message: `Failed to load Prettier config.\n\nError:\n${e}`,
							type: MessageType.Warning,
						});
						console.error('Failed to load Prettier config.', e);
					}

					const editorOptions = await context.env.getConfiguration<object>?.(
						'prettier',
						document.uri
					);

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
						plugins: [...(await getAstroPrettierPlugin()), ...(resolvedConfig.plugins ?? [])],
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
			}
		);
	}
}
