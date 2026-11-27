import { fileURLToPath } from 'node:url';
import {
	createKey,
	encodeKey,
	getEnvironmentKey,
	hasEnvironmentKey,
} from '@astrojs/runtime/_internal/core/encryption.js';
import { ASTRO_RENDERERS_MODULE_ID } from '@astrojs/vite-plugin-astro/_internal/vite-plugin-renderers/const.js';
import { normalizePath, type Plugin, type ViteDevServer } from 'vite';
import type { RouterConfig } from '../../config.js';
import type { SerializedSSRManifest } from '../core/app/types.js';
import type { RuntimeMode } from '../../types.js';
import {
	ASTRO_VITE_ENVIRONMENT_NAMES,
	MANIFEST_REPLACE,
	SERIALIZED_MANIFEST_ID,
	SERIALIZED_MANIFEST_RESOLVED_ID,
} from '../core/constants.js';
import { createManifestExtensionsCode, createManifestImportsCode } from '../../pipeline-module.js';
import type { RouterRegistry } from '../registry.js';
import { VIRTUAL_PAGES_MODULE_ID } from '../vite-plugin-pages/index.js';
import { ASTRO_ROUTES_MODULE_ID } from '../vite-plugin-routes/index.js';

// The route info deserializer, imported by absolute path: projects that depend only on `astro`
// cannot resolve this package.
const APP_MANIFEST_MODULE = normalizePath(
	fileURLToPath(new URL('../core/app/manifest.js', import.meta.url)),
);

/** Fields of the serialized manifest that depend on the host (`astro`: its adapter and features). */
export type ManifestHostFields = Pick<
	SerializedSSRManifest,
	| 'serverLike'
	| 'middlewareMode'
	| 'adapterName'
	| 'clientDirectives'
	| 'csp'
	| 'devToolbar'
	| 'logLevel'
	| 'userAssetsBase'
>;

export interface SerializedManifestPluginOptions {
	/** Defaults to Vite's command. */
	command?: 'dev' | 'build';
	sync: boolean;
	routerRegistry: RouterRegistry;
	hostFields: () => Promise<ManifestHostFields>;
	/** Module ids the manifest loads lazily: `middleware`, `serverIslandMappings` and `logger`. */
	modules: { middleware: string; serverIslandMappings: string; logger?: () => string | undefined };
}

// Kept in sync with the static import in `src/core/manifest/ambient.ts` and the
// package.json `imports` mapping. In plain Node the specifier resolves (via that
// mapping) to the `undefined` stub in `core/manifest/ambient-source.ts`; in every
// Vite-processed server environment this plugin resolves it to the serialized
// manifest module, so the ambient manifest IS the virtual manifest there. No new
// virtual module ID is minted: the module dedupes into the same chunk as every
// other manifest importer and the build-time manifest injection is untouched.
export const AMBIENT_MANIFEST_SPECIFIER = '#astro-internal/ambient-manifest';

export function serializedManifestPlugin({
	command: commandOption,
	sync,
	routerRegistry,
	hostFields,
	modules,
}: SerializedManifestPluginOptions): Plugin {
	let command = commandOption ?? 'dev';
	let encodedKeyPromise: Promise<string> | undefined;

	function getEncodedKey() {
		encodedKeyPromise ??= (async () => {
			const key = hasEnvironmentKey() ? await getEnvironmentKey() : await createKey();
			return encodeKey(key);
		})();
		return encodedKeyPromise;
	}

	function reloadManifest(path: string | null, server: ViteDevServer) {
		const normalizedSrcDir = normalizePath(fileURLToPath(routerRegistry.config.srcDir));
		if (path != null && normalizePath(path).startsWith(normalizedSrcDir)) {
			const environment = server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr];
			const virtualMod = environment.moduleGraph.getModuleById(SERIALIZED_MANIFEST_RESOLVED_ID);
			if (!virtualMod) return;

			environment.moduleGraph.invalidateModule(virtualMod);
		}
	}

	return {
		name: SERIALIZED_MANIFEST_ID,
		enforce: 'pre',
		config(_, env) {
			command = commandOption ?? (env.command === 'serve' ? 'dev' : 'build');
		},
		// Dependency optimization runs as a nested Rolldown build that cannot load Vite virtual
		// modules. Keep this import external so the server module graph resolves it below.
		configEnvironment(environmentName) {
			if (
				command === 'dev' &&
				(environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.astro ||
					environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
					environmentName === ASTRO_VITE_ENVIRONMENT_NAMES.prerender)
			) {
				return {
					optimizeDeps: {
						rolldownOptions: {
							external: [AMBIENT_MANIFEST_SPECIFIER],
						},
					},
				};
			}
		},
		configureServer(server) {
			server.watcher.on('add', (path) => reloadManifest(path, server));
			server.watcher.on('unlink', (path) => reloadManifest(path, server));
			server.watcher.on('change', (path) => reloadManifest(path, server));
		},

		// Restrict to server environments only since the generated code imports
		// server-only virtual modules (virtual:astro:routes, virtual:astro:pages)
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},

		resolveId: {
			filter: {
				id: new RegExp(`^(${SERIALIZED_MANIFEST_ID}|${AMBIENT_MANIFEST_SPECIFIER})$`),
			},
			handler() {
				return SERIALIZED_MANIFEST_RESOLVED_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${SERIALIZED_MANIFEST_RESOLVED_ID}$`),
			},
			async handler() {
				let manifestData: string;
				if (command === 'build' && !sync) {
					// Emit placeholder token that will be replaced by plugin-manifest.ts in build:post
					// See plugin-manifest.ts for full architecture explanation
					manifestData = `'${MANIFEST_REPLACE}'`;
				} else {
					const serialized = await createSerializedManifest(
						routerRegistry,
						await hostFields(),
						command === 'dev' ? 'development' : 'production',
						await getEncodedKey(),
					);
					manifestData = JSON.stringify(serialized);
				}
				const loggerModule = modules.logger?.();
				const loggerLine = loggerModule ? `logger: () => import('${loggerModule}'),` : '';
				const code = `
					// The manifest module (not the 'astro/app' barrel): the barrel pulls in
					// BaseApp -> DefaultFetchHandler -> the ambient-manifest module, which
					// resolves to THIS virtual module — importing the barrel here would close
					// a top-level import cycle that leaves deserializeManifest uninitialized
					// when the dev module graph re-evaluates after invalidation.
					import { deserializeManifest as _deserializeManifest } from ${JSON.stringify(APP_MANIFEST_MODULE)};
					import { renderers } from '${ASTRO_RENDERERS_MODULE_ID}';
					import { routes } from '${ASTRO_ROUTES_MODULE_ID}';
					import { pageMap } from '${VIRTUAL_PAGES_MODULE_ID}';
					${createManifestImportsCode(routerRegistry)}

					const _manifest = _deserializeManifest((${manifestData}));

				  // _manifest.routes contains enriched route info with scripts and styles,
				  // TODO port this info over to virtual:astro:routes to prevent the need to
				  // have this duplication
					const isDev = ${JSON.stringify(command === 'dev')};
					const manifestRoutes = isDev ? routes : _manifest.routes;
					
					const manifest = Object.assign(_manifest, {
					  renderers,
					  middleware: () => import('${modules.middleware}'),
					  ${createManifestExtensionsCode(routerRegistry)}
					  ${loggerLine}
					  serverIslandMappings: () => import('${modules.serverIslandMappings}'),
					  routes: manifestRoutes,
					  pageMap,
					});
					export { manifest };
				`;
				return { code };
			},
		},
	};
}

/** The serialized server manifest. */
export async function createSerializedManifest(
	routerRegistry: RouterRegistry,
	host: ManifestHostFields,
	runtimeMode: RuntimeMode,
	encodedKey?: string,
): Promise<SerializedSSRManifest> {
	const config: RouterConfig = routerRegistry.config;
	return {
		...routerRegistry.serializeManifestData(),
		...host,
		rootDir: config.root.toString(),
		srcDir: config.srcDir.toString(),
		cacheDir: config.cacheDir.toString(),
		outDir: config.outDir.toString(),
		buildServerDir: config.build.server.toString(),
		buildClientDir: config.build.client.toString(),
		publicDir: config.publicDir.toString(),
		assetsDir: config.build.assets,
		trailingSlash: config.trailingSlash,
		buildFormat: config.build.format,
		runtimeMode,
		compressHTML: config.compressHTML,
		assets: [],
		entryModules: {},
		routes: [],
		renderers: [],
		base: config.base,
		assetsPrefix: config.build.assetsPrefix,
		site: config.site,
		componentMetadata: [],
		inlinedScripts: [],
		checkOrigin: config.security.checkOrigin && host.serverLike,
		allowedDomains: config.security.allowedDomains,
		serverIslandBodySizeLimit: config.security.serverIslandBodySizeLimit,
		key:
			encodedKey ??
			(await encodeKey(hasEnvironmentKey() ? await getEnvironmentKey() : await createKey())),
		shouldInjectCspMetaTags: false,
	};
}
