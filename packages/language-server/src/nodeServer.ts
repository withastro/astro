import {
	createConnection,
	createServer,
	createTypeScriptProject,
	loadTsdkByPath,
} from '@volar/language-server/node';
import { URI, Utils } from 'vscode-uri';
import {
	SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS,
	type CollectionConfig,
} from './core/frontmatterHolders.js';
import { getLanguagePlugins, getLanguageServicePlugins } from './languageServerPlugin.js';

const connection = createConnection();
const server = createServer(connection);

let contentIntellisenseEnabled = false;

connection.listen();

connection.onInitialize((params) => {
	const tsdk = params.initializationOptions?.typescript?.tsdk;

	if (!tsdk) {
		throw new Error(
			'The `typescript.tsdk` init option is required. It should point to a directory containing a `typescript.js` or `tsserverlibrary.js` file, such as `node_modules/typescript/lib`.',
		);
	}

	const { typescript, diagnosticMessages } = loadTsdkByPath(tsdk, params.locale);

	contentIntellisenseEnabled = params.initializationOptions?.contentIntellisense ?? false;
	let collectionConfigs: { folder: URI; config: CollectionConfig['config'] }[] = [];

	if (contentIntellisenseEnabled) {
		// The vast majority of clients support workspaceFolders, but notably our tests currently don't
		// Ref: https://github.com/volarjs/volar.js/issues/229
		const folders =
			params.workspaceFolders ?? (params.rootUri ? [{ uri: params.rootUri }] : []) ?? [];

		collectionConfigs = folders.flatMap((folder) => {
			try {
				const folderUri = URI.parse(folder.uri);
				let config = server.fs.readFile(
					Utils.joinPath(folderUri, '.astro/collections/collections.json'),
				);

				if (!config) {
					return [];
				}

				// `server.fs.readFile` can theoretically be async, but in practice it's always sync
				const collections = JSON.parse(config as string) as CollectionConfig['config'];

				return { folder: folderUri, config: collections };
			} catch (err) {
				// If the file doesn't exist, we don't really care, but if it's something else, we want to know
				if (err && (err as any).code !== 'ENOENT') console.error(err);
				return [];
			}
		});
	}

	return server.initialize(
		params,
		createTypeScriptProject(typescript, diagnosticMessages, ({ env, configFileName }) => {
			return {
				languagePlugins: getLanguagePlugins(
					connection,
					typescript,
					env,
					configFileName,
					collectionConfigs,
				),
				setup() {},
			};
		}),
		getLanguageServicePlugins(connection, typescript, collectionConfigs),
		{ pullModelDiagnostics: params.initializationOptions?.pullModelDiagnostics },
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
		extensions.push(...SUPPORTED_FRONTMATTER_EXTENSIONS_KEYS);
	}

	server.watchFiles([`**/*.{${extensions.join(',')}}`]);
});
