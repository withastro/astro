import type { SSRManifestCSP } from '@astrojs/vite-plugin-router/_internal/core/app/types.js';
import { partitionByKind } from '@astrojs/vite-plugin-router/_internal/core/csp/runtime.js';
import {
	SERIALIZED_MANIFEST_ID,
	SERIALIZED_MANIFEST_RESOLVED_ID,
} from '@astrojs/vite-plugin-router/_internal/core/constants.js';
import {
	type ManifestHostFields,
	serializedManifestPlugin as routerSerializedManifestPlugin,
} from '@astrojs/vite-plugin-router/_internal/manifest/serialized.js';
import type { RouterRegistry } from '@astrojs/vite-plugin-router/_internal/registry.js';
import type { Plugin } from 'vite';
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
import { VIRTUAL_LOGGER_ID } from '../core/logger/vite-plugin.js';
import { MIDDLEWARE_MODULE_ID } from '../core/middleware/vite-plugin.js';
import { SERVER_ISLAND_MANIFEST } from '@astrojs/vite-plugin-router/_internal/core/server-islands/vite-plugin-server-islands.js';
import { resolveMiddlewareMode } from '../integrations/adapter-utils.js';
import type { AstroSettings } from '../types/astro.js';

// This is used by Cloudflare optimizeDeps config
export { SERIALIZED_MANIFEST_ID, SERIALIZED_MANIFEST_RESOLVED_ID };

function createCspManifest(settings: AstroSettings): SSRManifestCSP | undefined {
	const cspConfig = settings.config.security.csp;
	if (!shouldTrackCspHashes(cspConfig)) return undefined;
	const scriptDirective = {
		resources: getScriptResources(cspConfig),
		hashes: getScriptHashes(cspConfig),
		strictDynamic: getStrictDynamic(cspConfig),
	};
	const styleDirective = {
		resources: getStyleResources(cspConfig),
		hashes: getStyleHashes(cspConfig),
	};
	// Derive the deprecated flat fields from the `default`-kind entries for back-compat.
	const scriptDefault = partitionByKind(scriptDirective).default;
	const styleDefault = partitionByKind(styleDirective).default;
	return {
		cspDestination: settings.adapter?.adapterFeatures?.staticHeaders ? 'adapter' : undefined,
		algorithm: getAlgorithm(cspConfig),
		directives: getDirectives(settings),
		scriptHashes: scriptDefault.hashes,
		scriptResources: scriptDefault.resources,
		isStrictDynamic: scriptDirective.strictDynamic,
		styleHashes: styleDefault.hashes,
		styleResources: styleDefault.resources,
		scriptDirective,
		styleDirective,
	};
}

/** The serialized manifest fields that come from an Astro project's adapter and features. */
export async function getManifestHostFields(settings: AstroSettings): Promise<ManifestHostFields> {
	return {
		serverLike: settings.buildOutput === 'server',
		middlewareMode: resolveMiddlewareMode(settings.adapter?.adapterFeatures),
		adapterName: settings?.adapter?.name ?? '',
		clientDirectives: Array.from(settings.clientDirectives.entries()),
		userAssetsBase: settings.config?.vite?.base,
		csp: createCspManifest(settings),
		devToolbar: {
			enabled:
				settings.config.devToolbar.enabled &&
				(await settings.preferences.get('devToolbar.enabled')),
			latestAstroVersion: settings.latestAstroVersion,
			debugInfoOutput: '',
			placement: settings.config.devToolbar.placement,
		},
		logLevel: settings.logLevel,
	};
}

export function serializedManifestPlugin({
	settings,
	command,
	sync,
	routerRegistry,
}: {
	settings: AstroSettings;
	command: 'dev' | 'build';
	sync: boolean;
	routerRegistry: RouterRegistry;
}): Plugin {
	return routerSerializedManifestPlugin({
		command,
		sync,
		routerRegistry,
		hostFields: () => getManifestHostFields(settings),
		modules: {
			middleware: MIDDLEWARE_MODULE_ID,
			serverIslandMappings: SERVER_ISLAND_MANIFEST,
			logger: () => (settings.config.logger ? VIRTUAL_LOGGER_ID : undefined),
		},
	});
}
