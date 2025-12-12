import type { Plugin } from 'vite';
import { ACTIONS_ENTRYPOINT_VIRTUAL_MODULE_ID } from '../actions/consts.js';
import { toFallbackType } from '../core/app/common.js';
import { toRoutingStrategy } from '../core/app/index.js';
import type { SerializedSSRManifest, SSRManifestCSP, SSRManifestI18n } from '../core/app/types.js';
import { MANIFEST_REPLACE } from '../core/build/plugins/plugin-manifest.js';
import {
	getAlgorithm,
	getDirectives,
	getScriptHashes,
	getScriptResources,
	getStrictDynamic,
	getStyleHashes,
	getStyleResources,
	shouldTrackCspHashes,
} from '../core/csp/common.js';
import { createKey, encodeKey, getEnvironmentKey, hasEnvironmentKey } from '../core/encryption.js';
import { MIDDLEWARE_MODULE_ID } from '../core/middleware/vite-plugin.js';
import { SERVER_ISLAND_MANIFEST } from '../core/server-islands/vite-plugin-server-islands.js';
import { VIRTUAL_SESSION_DRIVER_ID } from '../core/session/vite-plugin.js';
import type { AstroSettings } from '../types/astro.js';
import { VIRTUAL_PAGES_MODULE_ID } from '../vite-plugin-pages/index.js';
import { ASTRO_RENDERERS_MODULE_ID } from '../vite-plugin-renderers/index.js';
import { ASTRO_ROUTES_MODULE_ID } from '../vite-plugin-routes/index.js';
import { sessionConfigToManifest } from '../core/session/utils.js';

export const SERIALIZED_MANIFEST_ID = 'virtual:astro:manifest';
export const SERIALIZED_MANIFEST_RESOLVED_ID = '\0' + SERIALIZED_MANIFEST_ID;

export function serializedManifestPlugin({
	settings,
	command,
	sync,
}: {
	settings: AstroSettings;
	command: 'dev' | 'build';
	sync: boolean;
}): Plugin {
	return {
		name: SERIALIZED_MANIFEST_ID,
		enforce: 'pre',

		resolveId(id) {
			if (id === SERIALIZED_MANIFEST_ID) {
				return SERIALIZED_MANIFEST_RESOLVED_ID;
			}
		},

		async load(id) {
			if (id === SERIALIZED_MANIFEST_RESOLVED_ID) {
				let manifestData: string;
				if (command === 'build' && !sync) {
					// Emit placeholder token that will be replaced by plugin-manifest.ts in build:post
					// See plugin-manifest.ts for full architecture explanation
					manifestData = `'${MANIFEST_REPLACE}'`;
				} else {
					const serialized = await createSerializedManifest(settings);
					manifestData = JSON.stringify(serialized);
				}
				const code = `
					import { deserializeManifest as _deserializeManifest } from 'astro/app';
					import { renderers } from '${ASTRO_RENDERERS_MODULE_ID}';
					import { routes } from '${ASTRO_ROUTES_MODULE_ID}';
					import { pageMap } from '${VIRTUAL_PAGES_MODULE_ID}';

					const _manifest = _deserializeManifest((${manifestData}));

				  // _manifest.routes contains enriched route info with scripts and styles,
				  // TODO port this info over to virtual:astro:routes to prevent the need to
				  // have this duplication
					const isDev = ${JSON.stringify(command === 'dev')};
					const manifestRoutes = isDev ? routes : _manifest.routes;
					
					const manifest = Object.assign(_manifest, {
					  renderers,
					  actions: () => import('${ACTIONS_ENTRYPOINT_VIRTUAL_MODULE_ID}'),
					  middleware: () => import('${MIDDLEWARE_MODULE_ID}'),
					  sessionDriver: () => import('${VIRTUAL_SESSION_DRIVER_ID}'),
					  serverIslandMappings: () => import('${SERVER_ISLAND_MANIFEST}'),
					  routes: manifestRoutes,
					  pageMap,
					});
					export { manifest };
				`;
				return { code };
			}
		},
	};
}

async function createSerializedManifest(settings: AstroSettings): Promise<SerializedSSRManifest> {
	let i18nManifest: SSRManifestI18n | undefined;
	let csp: SSRManifestCSP | undefined;
	if (settings.config.i18n) {
		i18nManifest = {
			fallback: settings.config.i18n.fallback,
			strategy: toRoutingStrategy(settings.config.i18n.routing, settings.config.i18n.domains),
			defaultLocale: settings.config.i18n.defaultLocale,
			locales: settings.config.i18n.locales,
			domainLookupTable: {},
			fallbackType: toFallbackType(settings.config.i18n.routing),
			domains: settings.config.i18n.domains,
		};
	}

	if (shouldTrackCspHashes(settings.config.security.csp)) {
		csp = {
			cspDestination: settings.adapter?.adapterFeatures?.experimentalStaticHeaders
				? 'adapter'
				: undefined,
			scriptHashes: getScriptHashes(settings.config.security.csp),
			scriptResources: getScriptResources(settings.config.security.csp),
			styleHashes: getStyleHashes(settings.config.security.csp),
			styleResources: getStyleResources(settings.config.security.csp),
			algorithm: getAlgorithm(settings.config.security.csp),
			directives: getDirectives(settings),
			isStrictDynamic: getStrictDynamic(settings.config.security.csp),
		};
	}

	return {
		rootDir: settings.config.root.toString(),
		srcDir: settings.config.srcDir.toString(),
		cacheDir: settings.config.cacheDir.toString(),
		outDir: settings.config.outDir.toString(),
		buildServerDir: settings.config.build.server.toString(),
		buildClientDir: settings.config.build.client.toString(),
		publicDir: settings.config.publicDir.toString(),
		assetsDir: settings.config.build.assets,
		trailingSlash: settings.config.trailingSlash,
		buildFormat: settings.config.build.format,
		compressHTML: settings.config.compressHTML,
		serverLike: settings.buildOutput === 'server',
		assets: [],
		entryModules: {},
		routes: [],
		adapterName: settings?.adapter?.name ?? '',
		clientDirectives: Array.from(settings.clientDirectives.entries()),
		renderers: [],
		base: settings.config.base,
		userAssetsBase: settings.config?.vite?.base,
		assetsPrefix: settings.config.build.assetsPrefix,
		site: settings.config.site,
		componentMetadata: [],
		inlinedScripts: [],
		i18n: i18nManifest,
		checkOrigin:
			(settings.config.security?.checkOrigin && settings.buildOutput === 'server') ?? false,
		key: await encodeKey(hasEnvironmentKey() ? await getEnvironmentKey() : await createKey()),
		session: sessionConfigToManifest(settings.config.session),
		csp,
		devToolbar: {
			enabled:
				settings.config.devToolbar.enabled &&
				(await settings.preferences.get('devToolbar.enabled')),
			latestAstroVersion: settings.latestAstroVersion,
			debugInfoOutput: '',
		},
		logLevel: settings.logLevel,
	};
}
