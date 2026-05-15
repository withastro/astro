'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.create = void 0;
exports.getSettings = getSettings;
const language_server_1 = require('@volar/language-server');
const volar_service_yaml_1 = require('volar-service-yaml');
const vscode_uri_1 = require('vscode-uri');
const frontmatterHolders_js_1 = require('../core/frontmatterHolders.js');
function getSettings(collectionConfig) {
	const schemas = collectionConfig.configs.flatMap((workspaceCollectionConfig) => {
		return workspaceCollectionConfig.config.collections.flatMap((collection) => {
			return {
				fileMatch: frontmatterHolders_js_1.SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS.map(
					(ext) => `volar-embedded-content://yaml_frontmatter_${collection.name}/**/*${ext}`,
				),
				uri: vscode_uri_1.Utils.joinPath(
					workspaceCollectionConfig.folder,
					'.astro/collections',
					`${collection.name}.schema.json`,
				).toString(),
			};
		});
	});
	return {
		completion: true,
		format: false,
		hover: true,
		validate: true,
		customTags: [],
		yamlVersion: '1.2',
		isKubernetes: false,
		parentSkeletonSelectedFirst: false,
		disableDefaultProperties: false,
		schemas: schemas,
	};
}
const create = (collectionConfig) => {
	const yamlPlugin = (0, volar_service_yaml_1.create)({
		getLanguageSettings: () => getSettings(collectionConfig),
	});
	return {
		...yamlPlugin,
		capabilities: {
			...yamlPlugin.capabilities,
			codeLensProvider: undefined,
		},
		create(context) {
			const yamlPluginInstance = yamlPlugin.create(context);
			const languageService = yamlPluginInstance.provide?.['yaml/languageService']();
			if (languageService && context.env.onDidChangeWatchedFiles) {
				context.env.onDidChangeWatchedFiles(async (events) => {
					const changedSchemas = events.changes.filter((change) =>
						change.uri.endsWith('.schema.json'),
					);
					const changedConfig = events.changes.some((change) =>
						change.uri.endsWith('collections.json'),
					);
					if (changedConfig) {
						collectionConfig.reload(
							// For some reason, context.env.workspaceFolders is neither an array of WorkspaceFolders nor the older format, strange
							context.env.workspaceFolders.map((folder) => ({ uri: folder.toString() })),
						);
						languageService.configure(getSettings(collectionConfig));
					}
					for (const change of changedSchemas) {
						languageService.resetSchema(change.uri);
					}
				});
			}
			return {
				...yamlPluginInstance,
				// Disable codelenses, we'll provide our own
				provideCodeLenses: undefined,
				resolveCodeLens: undefined,
				async provideDiagnostics(document, token) {
					const originalDiagnostics = await yamlPluginInstance.provideDiagnostics(document, token);
					if (!originalDiagnostics) {
						return null;
					}
					const decoded = context.decodeEmbeddedDocumentUri(vscode_uri_1.URI.parse(document.uri));
					const sourceScript = decoded && context.language.scripts.get(decoded[0]);
					const root = sourceScript?.generated?.root;
					if (!(root instanceof frontmatterHolders_js_1.FrontmatterHolder)) return undefined;
					// If we don't have a frontmatter, but there are errors, it probably means a frontmatter was required
					if (!root.hasFrontmatter && originalDiagnostics.length > 0) {
						return [
							language_server_1.Diagnostic.create(
								language_server_1.Range.create(0, 0, 0, 0),
								'Frontmatter is required for this file.',
								language_server_1.DiagnosticSeverity.Error,
							),
						];
					}
					return originalDiagnostics.map((diagnostic) => {
						// The YAML schema source is not useful to users, since it's generated. Also, it's quite long.
						if (diagnostic.source?.startsWith('yaml-schema:')) {
							diagnostic.source = 'astro';
							// In Astro, schema errors are always fatal
							diagnostic.severity = language_server_1.DiagnosticSeverity.Error;
							// Map missing properties to the entire frontmatter
							if (diagnostic.message.startsWith('Missing property')) {
								diagnostic.range = language_server_1.Range.create(
									{ line: 0, character: 0 },
									document.positionAt(document.getText().length),
								);
							}
						}
						return diagnostic;
					});
				},
				async provideHover(document, position, token) {
					const originalHover = await yamlPluginInstance.provideHover(document, position, token);
					if (!originalHover) {
						return null;
					}
					if (language_server_1.MarkupContent.is(originalHover.contents)) {
						// Remove last line that contains the source schema, it's not useful to users since they're generated
						originalHover.contents.value = originalHover.contents.value
							.replace(/\nSource:.*$/, '')
							.replace(/\n\nsource$/, '')
							.trim();
					}
					return originalHover;
				},
			};
		},
	};
};
exports.create = create;
//# sourceMappingURL=yaml.js.map
