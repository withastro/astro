import type { Plugin } from 'vite';
import { toFallbackType } from '../core/app/common.js';
import { toRoutingStrategy } from '../core/app/index.js';
import type { SerializedSSRManifest, SSRManifestCSP, SSRManifestI18n } from '../core/app/types.js';
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
import type { AstroSettings } from '../types/astro.js';

export const SERIALIZED_MANIFEST_ID = 'astro:serialized-manifest';
const SERIALIZED_MANIFEST_RESOLVED_ID = '\0' + SERIALIZED_MANIFEST_ID;

export async function serializedManifestPlugin({
	settings,
}: {
	settings: AstroSettings;
}): Promise<Plugin> {
	return {
		name: 'astro:serialized-manifest',
		enforce: 'pre',
		resolveId(id) {
			if (id === SERIALIZED_MANIFEST_ID) {
				return SERIALIZED_MANIFEST_RESOLVED_ID;
			}
		},

		async load(id) {
			if (id === SERIALIZED_MANIFEST_RESOLVED_ID) {
				const serialized = await createSerializedManifest(settings);
				const code = `
					import { deserializeManifest as _deserializeManifest } from 'astro/app';
					export const manifest = _deserializeManifest((${JSON.stringify(serialized)}));
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
		serverIslandNameMap: [],
	};
}
