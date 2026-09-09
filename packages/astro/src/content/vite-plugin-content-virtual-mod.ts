import nodeFs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isRunnableDevEnvironment, normalizePath, type Plugin, type ViteDevServer } from 'vite';
import { createContentDataIncrementalMetadata } from '../core/build/incremental-metadata.js';
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
	DATA_STORE_CHUNK_FILE_NAME_PATTERN,
	DATA_STORE_CHUNK_VIRTUAL_ID_PREFIX,
	DATA_STORE_MANIFEST_FILE,
	DATA_STORE_VIRTUAL_ID,
	MODULES_IMPORTS_FILE,
	MODULES_MJS_ID,
	MODULES_MJS_VIRTUAL_ID,
	RESOLVED_DATA_STORE_CHUNK_VIRTUAL_ID_PREFIX,
	RESOLVED_DATA_STORE_CHUNK_VIRTUAL_ID_SUFFIX,
	RESOLVED_DATA_STORE_VIRTUAL_ID,
	RESOLVED_VIRTUAL_MODULE_ID,
	VIRTUAL_MODULE_ID,
} from './consts.js';
import type { MutableDataStore } from './mutable-data-store.js';
import { getDataStoreChunkSize, getDataStoreDir, getDataStoreFile } from './paths.js';
import { getContentPaths, isDeferredModule } from './utils.js';

interface AstroContentVirtualModPluginParams {
	settings: AstroSettings;
	fs: typeof nodeFs;
}

function invalidateAssetImports(viteServer: ViteDevServer, filePath: string) {
	const timestamp = Date.now();
	for (const environment of Object.values(viteServer.environments)) {
		const modules = environment.moduleGraph.getModulesByFile(filePath);
		if (modules) {
			for (const module of modules) {
				environment.moduleGraph.invalidateModule(module, undefined, timestamp, true);
			}
		}
		if (isRunnableDevEnvironment(environment)) {
			const runnerModules = environment.runner.evaluatedModules.getModulesByFile(filePath);
			if (runnerModules) {
				for (const runnerModule of runnerModules) {
					environment.runner.evaluatedModules.invalidateModule(runnerModule);
				}
			}
		}
	}
}

function invalidateDataStore(viteServer: ViteDevServer, { notifyClient = true } = {}) {
	const environment = viteServer.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
	const module = environment.moduleGraph.getModuleById(RESOLVED_DATA_STORE_VIRTUAL_ID);
	if (module) {
		const timestamp = Date.now();
		// Pass `true` to mark this as HMR invalidation so Vite drops cached SSR results.
		environment.moduleGraph.invalidateModule(module, undefined, timestamp, true);
	}
	// Also invalidate the module in the SSR module runner's evaluation cache.
	// Server-side invalidation only clears `transformResult`, but the runner
	// may still hold a stale evaluated result. When the runner's `fetchModule`
	// call triggers a fresh server transform, the transform re-populates
	// `transformResult` before the runner checks it, causing a false cache hit.
	if (isRunnableDevEnvironment(environment)) {
		const runnerModule = environment.runner.evaluatedModules.getModuleById(
			RESOLVED_DATA_STORE_VIRTUAL_ID,
		);
		if (runnerModule) {
			environment.runner.evaluatedModules.invalidateModule(runnerModule);
		}
	}
	// Signal the SSR runner to clear its route cache so that getStaticPaths()
	// is re-evaluated with the updated content collection data.
	environment.hot.send('astro:content-changed', {});
	// Only notify the client to reload when data has actually changed at runtime.
	// During initial startup (buildStart), no client has loaded content yet, so
	// sending a full-reload would just cause a spurious page reload for the first
	// browser that connects.
	if (notifyClient) {
		viteServer.environments.client.hot.send({
			type: 'full-reload',
			path: '*',
		});
	}
}

// Timestamps of direct (write-driven) invalidations, keyed by file path. The
// file watcher usually observes the same write shortly afterwards; watcher
// events inside this window are echoes of an invalidation that has already
// happened and are skipped so clients don't get two full reloads for one change.
const directInvalidations = new Map<string, number>();
const DIRECT_INVALIDATION_ECHO_MS = 1000;

function markDirectInvalidation(path: string) {
	directInvalidations.set(path, Date.now());
}

function isDirectInvalidationEcho(path: string) {
	const time = directInvalidations.get(path);
	return time !== undefined && Date.now() - time < DIRECT_INVALIDATION_ECHO_MS;
}

/** The file whose write commits a data store update during dev. */
function getDevDataStoreFile(settings: AstroSettings): URL {
	if (getDataStoreChunkSize(settings) !== undefined) {
		return new URL(DATA_STORE_MANIFEST_FILE, getDataStoreDir(settings, true));
	}
	return getDataStoreFile(settings, true);
}

/**
 * Invalidates the content virtual modules directly whenever the given store
 * writes to disk. The watcher listeners in `configureServer` cover writes from
 * other processes, but the watcher can miss the atomic rename that commits a
 * write on some platforms (notably Windows, see #17335), leaving dev serving
 * stale content until a restart. Subscribing to the store's own write
 * notifications makes invalidation of this process's writes deterministic.
 */
export function attachDataStoreInvalidation(
	store: MutableDataStore,
	server: ViteDevServer,
	settings: AstroSettings,
) {
	const dataStorePath = fileURLToPath(getDevDataStoreFile(settings));
	const assetImportsPath = fileURLToPath(new URL(ASSET_IMPORTS_FILE, settings.dotAstroDir));
	store.onFileWritten((path) => {
		if (path === dataStorePath) {
			markDirectInvalidation(dataStorePath);
			invalidateDataStore(server);
			invalidateAssetImports(server, assetImportsPath);
		} else if (path === assetImportsPath) {
			markDirectInvalidation(assetImportsPath);
			invalidateAssetImports(server, assetImportsPath);
		}
	});
}

export function astroContentVirtualModPlugin({
	settings,
	fs,
}: AstroContentVirtualModPluginParams): Plugin {
	let dataStoreDir: URL;
	let dataStoreFile: URL;
	let devServer: ViteDevServer;
	let liveConfig: string;
	let isDev = false;
	return {
		name: 'astro-content-virtual-mod-plugin',
		enforce: 'pre',
		config(_, env) {
			isDev = env.command === 'serve';
			dataStoreDir = getDataStoreDir(settings, isDev);
			if (getDataStoreChunkSize(settings) !== undefined) {
				dataStoreFile = new URL(DATA_STORE_MANIFEST_FILE, dataStoreDir);
			} else {
				dataStoreFile = getDataStoreFile(settings, isDev);
			}
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
				const assetImportsPath = fileURLToPath(new URL(ASSET_IMPORTS_FILE, settings.dotAstroDir));
				// We defer adding the data store file to the watcher until the server is ready
				devServer.watcher.add(fileURLToPath(dataStoreFile));
				devServer.watcher.add(assetImportsPath);
				// Manually invalidate the data store to avoid a race condition in file watching.
				// Skip client reload since no browser has loaded content yet at startup.
				invalidateDataStore(devServer, { notifyClient: false });
				invalidateAssetImports(devServer, assetImportsPath);
			}
		},
		resolveId: {
			filter: {
				id: new RegExp(
					`^(${VIRTUAL_MODULE_ID}|${DATA_STORE_VIRTUAL_ID}|${MODULES_MJS_ID}|${ASSET_IMPORTS_VIRTUAL_ID})$|^${DATA_STORE_CHUNK_VIRTUAL_ID_PREFIX}|(?:\\?|&)${CONTENT_MODULE_FLAG}(?:&|=|$)`,
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
				if (id.startsWith(DATA_STORE_CHUNK_VIRTUAL_ID_PREFIX)) {
					const fileName = id.slice(DATA_STORE_CHUNK_VIRTUAL_ID_PREFIX.length);
					if (!DATA_STORE_CHUNK_FILE_NAME_PATTERN.test(fileName)) {
						this.error(`Invalid data-store chunk: ${fileName}`);
					}
					return `${RESOLVED_DATA_STORE_CHUNK_VIRTUAL_ID_PREFIX}${fileName}${RESOLVED_DATA_STORE_CHUNK_VIRTUAL_ID_SUFFIX}`;
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
						return {
							id: fileURLToPath(modules),
							meta: createContentDataIncrementalMetadata(),
						};
					}
					return MODULES_MJS_VIRTUAL_ID;
				}

				if (id === ASSET_IMPORTS_VIRTUAL_ID) {
					const assetImportsFile = new URL(ASSET_IMPORTS_FILE, settings.dotAstroDir);
					if (fs.existsSync(assetImportsFile)) {
						return {
							id: fileURLToPath(assetImportsFile),
							meta: createContentDataIncrementalMetadata(),
						};
					}
					return ASSET_IMPORTS_RESOLVED_STUB_ID;
				}
			},
		},
		load: {
			filter: {
				id: new RegExp(
					`^(${RESOLVED_VIRTUAL_MODULE_ID}|${RESOLVED_DATA_STORE_VIRTUAL_ID}|${ASSET_IMPORTS_RESOLVED_STUB_ID}|${MODULES_MJS_VIRTUAL_ID})$|^${RESOLVED_DATA_STORE_CHUNK_VIRTUAL_ID_PREFIX}`,
				),
			},
			async handler(id) {
				if (id.startsWith(RESOLVED_DATA_STORE_CHUNK_VIRTUAL_ID_PREFIX)) {
					const resolvedFileName = id.slice(RESOLVED_DATA_STORE_CHUNK_VIRTUAL_ID_PREFIX.length);
					if (!resolvedFileName.endsWith(RESOLVED_DATA_STORE_CHUNK_VIRTUAL_ID_SUFFIX)) {
						this.error(`Invalid data-store chunk: ${resolvedFileName}`);
					}
					const fileName = resolvedFileName.slice(
						0,
						-RESOLVED_DATA_STORE_CHUNK_VIRTUAL_ID_SUFFIX.length,
					);
					if (!DATA_STORE_CHUNK_FILE_NAME_PATTERN.test(fileName)) {
						this.error(`Invalid data-store chunk: ${fileName}`);
					}
					const contents = await fs.promises.readFile(
						new URL(`./${fileName}`, dataStoreDir),
						'utf-8',
					);
					return {
						code: `export default ${JSON.stringify(contents)}`,
						map: { mappings: '' },
					};
				}
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
						return {
							code: 'export default new Map()',
							meta: createContentDataIncrementalMetadata(),
						};
					}
					const jsonData = await fs.promises.readFile(dataStoreFile, 'utf-8');

					if (getDataStoreChunkSize(settings) !== undefined) {
						try {
							const manifest: Record<string, string[]> = JSON.parse(jsonData);
							// Emit each part as a lazy virtual import so the parts stay separate
							// chunks instead of being inlined into one huge module (the very
							// thing chunking avoids). manifestToMap reads the resolved
							// namespace's `default` export back into the concatenated string.
							const chunkImport = (fileName: string) =>
								`(await import(${JSON.stringify(`${DATA_STORE_CHUNK_VIRTUAL_ID_PREFIX}${fileName}`)}))`;
							const entries = Object.entries(manifest).map(
								([collection, parts]) =>
									`${JSON.stringify(collection)}:[${parts.map(chunkImport).join(',')}]`,
							);
							const code = `export default{${entries.join(',')}}`;
							// Tag as content-data so the incremental route hash prunes this
							// module and the chunk modules it lazily imports; content edits are
							// tracked through each page's `cacheKey`, not the dependency hash.
							return {
								code,
								map: { mappings: '' },
								meta: createContentDataIncrementalMetadata(),
							};
						} catch (err) {
							const message = 'Could not parse data store manifest JSON file';
							this.error({ message, id, cause: err });
						}
					}

					try {
						// Validate here so a corrupt store fails loudly with this error
						// instead of being swallowed by the runtime's fallback to an
						// empty store.
						JSON.parse(jsonData);
					} catch (err) {
						const message = 'Could not parse JSON file';
						this.error({ message, id, cause: err });
					}

					// A JSON string parsed at runtime keeps the module's AST tiny; an
					// object literal grows with the store and can exceed what the
					// NAPI bridge can convert during dev SSR transforms (#17220),
					// and is slower for V8 to parse than JSON.parse.
					//
					// > Quoted from https://v8.dev/blog/cost-of-javascript-2019
					// >
					// > JSON.parse('…') is much faster to parse, compile, and execute
					// compared to an equivalent JavaScript literal — not just in V8
					// (1.7× as fast), but in all major JavaScript engines.
					return {
						code: `export default JSON.parse(${JSON.stringify(jsonData)})`,
						map: { mappings: '' },
						meta: createContentDataIncrementalMetadata(),
					};
				}

				if (id === ASSET_IMPORTS_RESOLVED_STUB_ID) {
					const assetImportsFile = new URL(ASSET_IMPORTS_FILE, settings.dotAstroDir);
					return {
						code: fs.existsSync(assetImportsFile)
							? fs.readFileSync(assetImportsFile, 'utf-8')
							: 'export default new Map()',
						meta: createContentDataIncrementalMetadata(),
					};
				}

				if (id === MODULES_MJS_VIRTUAL_ID) {
					const modules = new URL(MODULES_IMPORTS_FILE, settings.dotAstroDir);
					return {
						code: fs.existsSync(modules)
							? fs.readFileSync(modules, 'utf-8')
							: 'export default new Map()',
						meta: createContentDataIncrementalMetadata(),
					};
				}
			},
		},

		configureServer(server) {
			devServer = server;
			const dataStorePath = fileURLToPath(dataStoreFile);
			const assetImportsPath = fileURLToPath(new URL(ASSET_IMPORTS_FILE, settings.dotAstroDir));

			server.watcher.on('add', (addedPath) => {
				if (addedPath === dataStorePath && !isDirectInvalidationEcho(dataStorePath)) {
					invalidateDataStore(server);
					invalidateAssetImports(server, assetImportsPath);
				}
			});

			server.watcher.on('change', (changedPath) => {
				if (changedPath === dataStorePath) {
					if (isDirectInvalidationEcho(dataStorePath)) {
						return;
					}
					invalidateDataStore(server);
					invalidateAssetImports(server, assetImportsPath);
				} else if (
					changedPath === assetImportsPath &&
					!isDirectInvalidationEcho(assetImportsPath)
				) {
					invalidateAssetImports(server, assetImportsPath);
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
