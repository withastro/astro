'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const node_1 = require('@volar/language-server/node');
const vscode_uri_1 = require('vscode-uri');
const frontmatterHolders_js_1 = require('./core/frontmatterHolders.js');
const index_js_1 = require('./core/index.js');
const languageServerPlugin_js_1 = require('./languageServerPlugin.js');
const utils_js_1 = require('./utils.js');
const connection = (0, node_1.createConnection)();
const server = (0, node_1.createServer)(connection);
let contentIntellisenseEnabled = false;
connection.listen();
connection.onInitialize((params) => {
	const tsdk = params.initializationOptions?.typescript?.tsdk;
	if (!tsdk) {
		throw new Error(
			'The `typescript.tsdk` init option is required. It should point to a directory containing a `typescript.js` or `tsserverlibrary.js` file, such as `node_modules/typescript/lib`.',
		);
	}
	const { typescript, diagnosticMessages } = (0, node_1.loadTsdkByPath)(tsdk, params.locale);
	contentIntellisenseEnabled = params.initializationOptions?.contentIntellisense ?? false;
	const collectionConfig = {
		reload(folders) {
			this.configs = loadCollectionConfig(folders);
		},
		configs: contentIntellisenseEnabled
			? loadCollectionConfig(
					// The vast majority of clients support workspaceFolders, but sometimes some unusual environments like tests don't
					// @ts-expect-error - Just deprecated types, it's fine
					params.workspaceFolders ?? (params.rootUri ? [{ uri: params.rootUri }] : []) ?? [],
				)
			: [],
	};
	function loadCollectionConfig(folders) {
		return folders.flatMap((folder) => {
			try {
				const folderUri = vscode_uri_1.URI.parse(folder.uri);
				let config = server.fileSystem.readFile(
					vscode_uri_1.Utils.joinPath(folderUri, '.astro/collections/collections.json'),
				);
				if (!config) {
					return [];
				}
				// `server.fs.readFile` can theoretically be async, but in practice it's always sync
				const collections = JSON.parse(config);
				return { folder: folderUri, config: collections };
			} catch (err) {
				// If the file doesn't exist, we don't really care, but if it's something else, we want to know
				if (err && err.code !== 'ENOENT') console.error(err);
				return [];
			}
		});
	}
	return server.initialize(
		params,
		(0, node_1.createTypeScriptProject)(typescript, diagnosticMessages, ({ env }) => {
			return {
				languagePlugins: (0, languageServerPlugin_js_1.getLanguagePlugins)(collectionConfig),
				setup({ project }) {
					const { languageServiceHost, configFileName } = project.typescript;
					const rootPath = configFileName
						? configFileName.split('/').slice(0, -1).join('/')
						: env.workspaceFolders[0].fsPath;
					const nearestPackageJson = typescript.findConfigFile(
						rootPath,
						typescript.sys.fileExists,
						'package.json',
					);
					const astroInstall = (0, utils_js_1.getAstroInstall)([rootPath], {
						nearestPackageJson: nearestPackageJson,
						readDirectory: typescript.sys.readDirectory,
					});
					if (astroInstall === 'not-found') {
						connection.sendNotification(node_1.ShowMessageNotification.type, {
							message: `Couldn't find Astro in workspace "${rootPath}". Experience might be degraded. For the best experience, please make sure Astro is installed into your project and restart the language server.`,
							type: node_1.MessageType.Warning,
						});
					}
					(0, index_js_1.addAstroTypes)(
						typeof astroInstall === 'string' ? undefined : astroInstall,
						typescript,
						languageServiceHost,
					);
				},
			};
		}),
		(0, languageServerPlugin_js_1.getLanguageServicePlugins)(
			connection,
			typescript,
			collectionConfig,
			params,
		),
	);
});
connection.onInitialized(() => {
	server.initialized();
	const extensions = [
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
	];
	if (contentIntellisenseEnabled) {
		extensions.push(...frontmatterHolders_js_1.SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS);
		server.fileWatcher.watchFiles(['**/*.schema.json', '**/collections.json']);
		server.fileWatcher.onDidChangeWatchedFiles(({ changes }) => {
			const shouldReload = changes.some(
				(change) => change.uri.endsWith('.schema.json') || change.uri.endsWith('collections.json'),
			);
			if (shouldReload) {
				server.project.reload();
			}
		});
	}
	server.fileWatcher.watchFiles([`**/*.{${extensions.join(',')}}`]);
});
//# sourceMappingURL=nodeServer.js.map
