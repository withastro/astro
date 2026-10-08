import { createRequire } from 'node:module';
import * as path from 'node:path';
import {
	type Connection,
	type InitializeParams,
	type LanguagePlugin,
	MessageType,
	ShowMessageNotification,
} from '@volar/language-server/node';
// Services
import { create as createCssService } from 'volar-service-css';
import { create as createEmmetService } from 'volar-service-emmet';
import { create as createPrettierService } from 'volar-service-prettier';
import { create as createTypeScriptTwoSlashService } from 'volar-service-typescript-twoslash-queries';
import { URI } from 'vscode-uri';
import { getAstroLanguagePlugin } from './core';
import { type CollectionConfig, getFrontmatterLanguagePlugin } from './core/frontmatterHolders.js';
import { getSvelteLanguagePlugin } from './core/svelte.js';
import { getVueLanguagePlugin } from './core/vue.js';
import { getPrettierPluginPath, importPrettier } from './importPackage.js';
import { create as createAstroService } from './plugins/astro.js';
import { create as createHtmlService } from './plugins/html.js';
import { create as createTypeScriptServices } from './plugins/typescript/index.js';
import { create as createTypeScriptAddonsService } from './plugins/typescript-addons/index.js';
import { create as createYAMLService } from './plugins/yaml.js';

export function getLanguagePlugins(collectionConfig: CollectionConfig) {
	const languagePlugins: LanguagePlugin<URI>[] = [
		getAstroLanguagePlugin(),
		getVueLanguagePlugin(),
		getSvelteLanguagePlugin(),
		getFrontmatterLanguagePlugin(collectionConfig),
	];

	return languagePlugins;
}

export function getLanguageServicePlugins(
	connection: Connection,
	ts: typeof import('typescript'),
	collectionConfig: CollectionConfig,
	initializeParams?: InitializeParams,
) {
	// Extension contributions only apply to inferred projects. A configured project owns Astro
	// files only when its effective config explicitly contains an Astro content mapper.
	const typeScriptHandledElsewhere = isTypeScriptHandledByContentMapper(ts, initializeParams);

	const LanguageServicePlugins = [
		createHtmlService(),
		createCssService(),
		createEmmetService(),
		...(typeScriptHandledElsewhere
			? []
			: [
					...createTypeScriptServices(ts, {
						disableAutoImportCache: initializeParams?.initializationOptions?.disableAutoImportCache,
					}),
					createTypeScriptTwoSlashService(ts),
					createTypeScriptAddonsService(),
				]),
		createAstroService(),
		getPrettierService(),
		createYAMLService(collectionConfig),
	];

	return LanguageServicePlugins;

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
						document.uri,
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
			},
		);
	}
}

export function isTypeScriptHandledByContentMapper(
	ts: typeof import('typescript'),
	initializeParams?: InitializeParams,
): boolean {
	if (initializeParams?.initializationOptions?.astroContentMapperRegistered !== true) {
		return false;
	}

	const workspaceFolders =
		initializeParams.workspaceFolders?.map(({ uri }) => URI.parse(uri)) ??
		(initializeParams.rootUri ? [URI.parse(initializeParams.rootUri)] : []);
	for (const workspaceFolder of workspaceFolders) {
		if (workspaceFolder.scheme !== 'file') continue;

		const configFiles = ts.sys.readDirectory(
			workspaceFolder.fsPath,
			['.json'],
			['node_modules'],
			['**/tsconfig.json', '**/jsconfig.json'],
		);

		for (const configFile of configFiles) {
			const contentMappers = getEffectiveContentMappers(ts, configFile);
			const hasAstroMapper = contentMappers?.some(
				(mapper) => Array.isArray(mapper?.extensions) && mapper.extensions.includes('.astro'),
			);

			// Be conservative in mixed workspaces: keep the language server's TypeScript support
			// if any configured project would not receive TypeScript's inferred contribution.
			if (!hasAstroMapper) return false;
		}
	}

	// With no config, TypeScript uses the extension-provided inferred mapper. If every config
	// explicitly owns `.astro`, TypeScript uses those user-configured mappers instead.
	return true;
}

function getEffectiveContentMappers(
	ts: typeof import('typescript'),
	configFile: string,
	seen = new Set<string>(),
): any[] | undefined {
	configFile = path.resolve(configFile);
	if (seen.has(configFile)) return undefined;
	seen.add(configFile);

	const config = ts.readConfigFile(configFile, ts.sys.readFile).config;
	if (!config || typeof config !== 'object') return undefined;
	if (Object.prototype.hasOwnProperty.call(config, 'contentMappers')) {
		return Array.isArray(config.contentMappers) ? config.contentMappers : undefined;
	}

	const extendedConfigs = Array.isArray(config.extends) ? config.extends : [config.extends];
	let inherited: any[] | undefined;
	for (const extendedConfig of extendedConfigs) {
		if (typeof extendedConfig !== 'string') continue;
		const extendedConfigFile = resolveExtendedConfig(ts, configFile, extendedConfig);
		if (!extendedConfigFile) continue;
		inherited = getEffectiveContentMappers(ts, extendedConfigFile, seen) ?? inherited;
	}
	return inherited;
}

function resolveExtendedConfig(
	ts: typeof import('typescript'),
	configFile: string,
	extendedConfig: string,
): string | undefined {
	if (extendedConfig.startsWith('.') || path.isAbsolute(extendedConfig)) {
		const candidate = path.resolve(path.dirname(configFile), extendedConfig);
		for (const fileName of [candidate, `${candidate}.json`, path.join(candidate, 'tsconfig.json')]) {
			if (ts.sys.fileExists(fileName)) return fileName;
		}
		return undefined;
	}

	try {
		return createRequire(configFile).resolve(extendedConfig);
	} catch {
		return undefined;
	}
}
