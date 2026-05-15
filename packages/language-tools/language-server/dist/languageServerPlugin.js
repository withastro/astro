'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getLanguagePlugins = getLanguagePlugins;
exports.getLanguageServicePlugins = getLanguageServicePlugins;
const node_1 = require('@volar/language-server/node');
// Services
const volar_service_css_1 = require('volar-service-css');
const volar_service_emmet_1 = require('volar-service-emmet');
const volar_service_prettier_1 = require('volar-service-prettier');
const volar_service_typescript_twoslash_queries_1 = require('volar-service-typescript-twoslash-queries');
const vscode_uri_1 = require('vscode-uri');
const core_1 = require('./core');
const frontmatterHolders_js_1 = require('./core/frontmatterHolders.js');
const svelte_js_1 = require('./core/svelte.js');
const vue_js_1 = require('./core/vue.js');
const importPackage_js_1 = require('./importPackage.js');
const astro_js_1 = require('./plugins/astro.js');
const html_js_1 = require('./plugins/html.js');
const index_js_1 = require('./plugins/typescript/index.js');
const index_js_2 = require('./plugins/typescript-addons/index.js');
const yaml_js_1 = require('./plugins/yaml.js');
function getLanguagePlugins(collectionConfig) {
	const languagePlugins = [
		(0, core_1.getAstroLanguagePlugin)(),
		(0, vue_js_1.getVueLanguagePlugin)(),
		(0, svelte_js_1.getSvelteLanguagePlugin)(),
		(0, frontmatterHolders_js_1.getFrontmatterLanguagePlugin)(collectionConfig),
	];
	return languagePlugins;
}
function getLanguageServicePlugins(connection, ts, collectionConfig, initializeParams) {
	const LanguageServicePlugins = [
		(0, html_js_1.create)(),
		(0, volar_service_css_1.create)(),
		(0, volar_service_emmet_1.create)(),
		...(0, index_js_1.create)(ts, {
			disableAutoImportCache: initializeParams?.initializationOptions?.disableAutoImportCache,
		}),
		(0, volar_service_typescript_twoslash_queries_1.create)(ts),
		(0, index_js_2.create)(),
		(0, astro_js_1.create)(),
		getPrettierService(),
		(0, yaml_js_1.create)(collectionConfig),
	];
	return LanguageServicePlugins;
	function getPrettierService() {
		let prettier;
		let prettierPluginPath;
		let hasShownNotification = false;
		return (0, volar_service_prettier_1.create)(
			(context) => {
				for (const workspaceFolder of context.env.workspaceFolders) {
					if (workspaceFolder.scheme === 'file') {
						prettier = (0, importPackage_js_1.importPrettier)(workspaceFolder.fsPath);
						prettierPluginPath = (0, importPackage_js_1.getPrettierPluginPath)(
							workspaceFolder.fsPath,
						);
						if ((!prettier || !prettierPluginPath) && !hasShownNotification) {
							connection.sendNotification(node_1.ShowMessageNotification.type, {
								message:
									"Couldn't load `prettier` or `prettier-plugin-astro`. Formatting will not work. Please make sure those two packages are installed into your project and restart the language server.",
								type: node_1.MessageType.Warning,
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
					const uri = vscode_uri_1.URI.parse(document.uri);
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
						connection.sendNotification(node_1.ShowMessageNotification.type, {
							message: `Failed to load Prettier config.\n\nError:\n${e}`,
							type: node_1.MessageType.Warning,
						});
						console.error('Failed to load Prettier config.', e);
					}
					const editorOptions = await context.env.getConfiguration?.('prettier', document.uri);
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
							(await prettier.getSupportInfo()).languages.some((l) => l.name === 'astro') ||
							resolvedConfig.plugins?.includes('prettier-plugin-astro'); // getSupportInfo doesn't seems to work very well in Prettier 3 for plugins
						return hasPluginLoadedAlready ? [] : [prettierPluginPath];
					}
				},
			},
		);
	}
}
//# sourceMappingURL=languageServerPlugin.js.map
