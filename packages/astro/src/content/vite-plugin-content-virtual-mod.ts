import nodeFs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dataToEsm } from '@rollup/pluginutils';
import { normalizePath, type Plugin, type ViteDevServer } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../core/constants.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { rootRelativePath } from '../core/viteUtils.js';
import { isAstroClientEnvironment } from '../environments.js';
import type { AstroSettings } from '../types/astro.js';
import type { AstroPluginMetadata } from '../vite-plugin-astro/index.js';
import { createDefaultAstroMetadata } from '../vite-plugin-astro/metadata.js';
import {
	ASSET_IMPORTS_FILE,
	ASSET_IMPORTS_RESOLVED_STUB_ID,
	ASSET_IMPORTS_VIRTUAL_ID,
	CONTENT_MODULE_FLAG,
	CONTENT_RENDER_FLAG,
	DATA_STORE_VIRTUAL_ID,
	MODULES_IMPORTS_FILE,
	MODULES_MJS_ID,
	MODULES_MJS_VIRTUAL_ID,
	RESOLVED_DATA_STORE_VIRTUAL_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	VIRTUAL_MODULE_ID,
} from './consts.js';
import { getDataStoreFile } from './content-layer.js';
import { getContentPaths, isDeferredModule } from './utils.js';

interface AstroContentVirtualModPluginParams {
	settings: AstroSettings;
	fs: typeof nodeFs;
}

function invalidateDataStore(viteServer: ViteDevServer) {
	const environment = viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
	const module = environment.moduleGraph.getModuleById(RESOLVED_DATA_STORE_VIRTUAL_ID);
	if (module) {
		environment.moduleGraph.invalidateModule(module);
	}
	viteServer.environments.client.hot.send({
		type: 'full-reload',
		path: '*',
	});
}

export function astroContentVirtualModPlugin({
	settings,
	fs,
}: AstroContentVirtualModPluginParams): Plugin {
	let dataStoreFile: URL;
	let devServer: ViteDevServer;
	let liveConfig: string;
	return {
		name: 'astro-content-virtual-mod-plugin',
		enforce: 'pre',
		config(_, env) {
			dataStoreFile = getDataStoreFile(settings, env.command === 'serve');
			const contentPaths = getContentPaths(
				settings.config,
				undefined,
				settings.config.legacy?.collectionsBackwardsCompat,
			);
			if (contentPaths.liveConfig.exists) {
				liveConfig = normalizePath(fileURLToPath(contentPaths.liveConfig.url));
			}
		},
		buildStart() {
			if (devServer) {
				// We defer adding the data store file to the watcher until the server is ready
				devServer.watcher.add(fileURLToPath(dataStoreFile));
				// Manually invalidate the data store to avoid a race condition in file watching
				invalidateDataStore(devServer);
			}
		},
		resolveId: {
			filter: {
				id: new RegExp(
					`^(${VIRTUAL_MODULE_ID}|${DATA_STORE_VIRTUAL_ID}|${MODULES_MJS_ID}|${ASSET_IMPORTS_VIRTUAL_ID})$|(?:\\?|&)${CONTENT_MODULE_FLAG}(?:&|=|$)`,
				),
			},
			async handler(id, importer) {
				if (id === VIRTUAL_MODULE_ID) {
					// Live content config can't import the virtual module directly,
					// because it would create a circular dependency from the collection exports.
					// Instead, we resolve the config util module, because that's all that it should use anyway.
					if (liveConfig && importer && liveConfig === normalizePath(importer)) {
						return this.resolve('astro/virtual-modules/live-config', importer, {
							skipSelf: true,
						});
					}
					return RESOLVED_VIRTUAL_MODULE_ID;
				}
				if (id === DATA_STORE_VIRTUAL_ID) {
					return RESOLVED_DATA_STORE_VIRTUAL_ID;
				}

				if (isDeferredModule(id)) {
					const [, query] = id.split('?');
					const params = new URLSearchParams(query);
					const fileName = params.get('fileName');
					let importPath = undefined;
					if (fileName && URL.canParse(fileName, settings.config.root.toString())) {
						importPath = fileURLToPath(new URL(fileName, settings.config.root));
					}
					if (importPath) {
						return await this.resolve(`${importPath}?${CONTENT_RENDER_FLAG}`);
					}
				}

				if (id === MODULES_MJS_ID) {
					const modules = new URL(MODULES_IMPORTS_FILE, settings.dotAstroDir);
					if (fs.existsSync(modules)) {
						return fileURLToPath(modules);
					}
					return MODULES_MJS_VIRTUAL_ID;
				}

				if (id === ASSET_IMPORTS_VIRTUAL_ID) {
					const assetImportsFile = new URL(ASSET_IMPORTS_FILE, settings.dotAstroDir);
					if (fs.existsSync(assetImportsFile)) {
						return fileURLToPath(assetImportsFile);
					}
					return ASSET_IMPORTS_RESOLVED_STUB_ID;
				}
			},
		},
		load: {
			filter: {
				id: new RegExp(
					`^(${RESOLVED_VIRTUAL_MODULE_ID}|${RESOLVED_DATA_STORE_VIRTUAL_ID}|${ASSET_IMPORTS_RESOLVED_STUB_ID}|${MODULES_MJS_VIRTUAL_ID})$`,
				),
			},
			async handler(id) {
				if (id === RESOLVED_VIRTUAL_MODULE_ID) {
					const isClient = isAstroClientEnvironment(this.environment);
					const code = await generateContentEntryFile({
						settings,
						fs,
						isClient,
					});

					const astro = createDefaultAstroMetadata();
					astro.propagation = 'in-tree';
					return {
						code,
						meta: {
							astro,
						} satisfies AstroPluginMetadata,
					};
				}
				if (id === RESOLVED_DATA_STORE_VIRTUAL_ID) {
					if (!fs.existsSync(dataStoreFile)) {
						return { code: 'export default new Map()' };
					}
					const jsonData = await fs.promises.readFile(dataStoreFile, 'utf-8');

					try {
						const parsed = JSON.parse(jsonData);
						return {
							code: dataToEsm(parsed, {
								compact: true,
							}),
							map: { mappings: '' },
						};
					} catch (err) {
						const message = 'Could not parse JSON file';
						this.error({ message, id, cause: err });
					}
				}

				if (id === ASSET_IMPORTS_RESOLVED_STUB_ID) {
					const assetImportsFile = new URL(ASSET_IMPORTS_FILE, settings.dotAstroDir);
					return {
						code: fs.existsSync(assetImportsFile)
							? fs.readFileSync(assetImportsFile, 'utf-8')
							: 'export default new Map()',
					};
				}

				if (id === MODULES_MJS_VIRTUAL_ID) {
					const modules = new URL(MODULES_IMPORTS_FILE, settings.dotAstroDir);
					return {
						code: fs.existsSync(modules)
							? fs.readFileSync(modules, 'utf-8')
							: 'export default new Map()',
					};
				}
			},
		},

		configureServer(server) {
			devServer = server;
			const dataStorePath = fileURLToPath(dataStoreFile);
			// If the datastore file changes, invalidate the virtual module

			server.watcher.on('add', (addedPath) => {
				if (addedPath === dataStorePath) {
					invalidateDataStore(server);
				}
			});

			server.watcher.on('change', (changedPath) => {
				if (changedPath === dataStorePath) {
					invalidateDataStore(server);
				}
			});
		},
	};
}

async function generateContentEntryFile({
	settings,
	isClient,
}: {
	settings: AstroSettings;
	fs: typeof nodeFs;
	isClient: boolean;
}) {
	const contentPaths = getContentPaths(
		settings.config,
		undefined,
		settings.config.legacy?.collectionsBackwardsCompat,
	);
	const relContentDir = rootRelativePath(settings.config.root, contentPaths.contentDir);

	let virtualModContents: string;
	if (isClient) {
		throw new AstroError({
			...AstroErrorData.ServerOnlyModule,
			message: AstroErrorData.ServerOnlyModule.message('astro:content'),
		});
	} else {
		virtualModContents = nodeFs
			.readFileSync(contentPaths.virtualModTemplate, 'utf-8')
			.replace('@@CONTENT_DIR@@', relContentDir)
			.replace(
				'/* @@LIVE_CONTENT_CONFIG@@ */',
				contentPaths.liveConfig.exists
					? // Dynamic import so it extracts the chunk and avoids a circular import
						`const liveCollections = (await import(${JSON.stringify(fileURLToPath(contentPaths.liveConfig.url))})).collections;`
					: 'const liveCollections = {};',
			);
	}

	return virtualModContents;
}
