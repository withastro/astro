import type { Plugin } from 'vite';
import { ACTIONS_ENTRYPOINT_VIRTUAL_MODULE_ID } from '../actions/consts.js';
import { getInfoOutput } from '../cli/info/index.js';
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
import { ASTRO_RENDERERS_MODULE_ID } from '../vite-plugin-renderers/index.js';
import { ASTRO_ROUTES_MODULE_ID } from '../vite-plugin-routes/index.js';
import { VIRTUAL_PAGES_MODULE_ID } from '../vite-plugin-pages/index.js';

export const SERIALIZED_MANIFEST_ID = 'virtual:astro:manifest';
export const SERIALIZED_MANIFEST_RESOLVED_ID = '\0' + SERIALIZED_MANIFEST_ID;

export function serializedManifestPlugin({
	settings,
	command,
}: {
	settings: AstroSettings;
	command: 'dev' | 'build';
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
				if (command === 'build') {
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
					const manifest = Object.assign(_manifest, {
					  renderers,
					  actions: () => import('${ACTIONS_ENTRYPOINT_VIRTUAL_MODULE_ID}'),
					  middleware: () => import('${MIDDLEWARE_MODULE_ID}'),
					  sessionDriver: () => import('${VIRTUAL_SESSION_DRIVER_ID}'),
					  serverIslandMappings: () => import('${SERVER_ISLAND_MANIFEST}'),
					  routes,
					  pageMap,
					})
					export { manifest }
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

	if (shouldTrackCspHashes(settings.config.experimental.csp)) {
		csp = {
			cspDestination: settings.adapter?.adapterFeatures?.experimentalStaticHeaders
				? 'adapter'
				: undefined,
			scriptHashes: getScriptHashes(settings.config.experimental.csp),
			scriptResources: getScriptResources(settings.config.experimental.csp),
			styleHashes: getStyleHashes(settings.config.experimental.csp),
			styleResources: getStyleResources(settings.config.experimental.csp),
			algorithm: getAlgorithm(settings.config.experimental.csp),
			directives: getDirectives(settings),
			isStrictDynamic: getStrictDynamic(settings.config.experimental.csp),
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
		trailingSlash: settings.config.trailingSlash,
		buildFormat: settings.config.build.format,
		compressHTML: settings.config.compressHTML,
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
		sessionConfig: settings.config.session,
		csp,
		devToolbar: {
			enabled:
				settings.config.devToolbar.enabled &&
				(await settings.preferences.get('devToolbar.enabled')),
			latestAstroVersion: settings.latestAstroVersion,
			debugInfoOutput: await getInfoOutput({
				userConfig: settings.config,
				print: false,
			}),
		},
	};
}
