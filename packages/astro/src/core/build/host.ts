import { fileURLToPath } from 'node:url';
import type { SSRManifestCSP } from '@astrojs/vite-plugin-router/_internal/core/app/types.js';
import { partitionByKind } from '@astrojs/vite-plugin-router/_internal/core/csp/runtime.js';
import type { AstroLogger } from '@astrojs/vite-plugin-router/_internal/core/logger/core.js';
import { generateCspDigest, hashCryptoKey } from '@astrojs/runtime/_internal/core/encryption.js';
import { NoPrerenderedRoutesWithDomains } from '@astrojs/runtime/_internal/core/errors/errors-data.js';
import { AstroError } from '@astrojs/runtime/_internal/core/errors/index.js';
import { vitePluginActionsBuild } from '../../actions/vite-plugin-actions.js';
import { IMAGE_SERVICE_ENVIRONMENT_NAME } from '../../assets/consts.js';
import { LINKS_PLACEHOLDER } from '../../content/consts.js';
import { contentAssetsBuildPostHook } from '../../content/vite-plugin-content-assets.js';
import { resolveMiddlewareMode } from '../../integrations/adapter-utils.js';
import {
	runHookBuildGenerated,
	runHookBuildSetup,
	runHookBuildSsr,
	toIntegrationResolvedRoute,
} from '../../integrations/hooks.js';
import { generateSpeculationRulesContent } from '../../prefetch/speculation-rules.js';
import type { AstroSettings } from '../../types/astro.js';
import {
	getAlgorithm,
	getDirectives,
	getScriptHashes,
	getScriptResources,
	getStrictDynamic,
	getStyleHashes,
	getStyleResources,
	shouldTrackCspHashes,
	trackScriptHashes,
	trackScriptIntegrity,
	trackStyleHashes,
} from '../csp/common.js';
import { computeConfigHash } from './config-hash/index.js';
import { getImageServiceEnvironmentOptions, pluginImageServiceEntry } from './image-service.js';
import { IncrementalBuildCache } from '@astrojs/vite-plugin-router/_internal/core/build/incremental.js';
import type { BuildInternals } from '@astrojs/vite-plugin-router/_internal/core/build/internal.js';
import { computeLockfileHash } from './lockfile/index.js';
import { pluginIncremental } from './plugins/plugin-incremental.js';
import {
	isLegacyAdapter,
	LEGACY_SSR_ENTRY_VIRTUAL_MODULE,
	pluginSSR,
	RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE,
} from './plugins/plugin-ssr.js';
import type {
	BuildHost,
	BuildManifestHostFields,
} from '@astrojs/vite-plugin-router/_internal/core/build/types.js';

/** What an Astro project contributes to the build: its adapter, integrations and features. */
export function createBuildHost(settings: AstroSettings, logger: AstroLogger): BuildHost {
	const { config, adapter } = settings;
	const legacyAdapter = !adapter || isLegacyAdapter(adapter);
	return {
		adapter,
		renderers: settings.renderers,
		// The default prerenderer reports `SerializedStaticImage` metadata, the one `AstroPrerenderer` declares.
		prerenderer: settings.prerenderer as BuildHost['prerenderer'],
		// Only skip the default prerender entrypoint if an adapter with `entrypointResolution: 'self'` is used
		// AND provides a custom prerenderer. Otherwise, use the default.
		prerenderEntry:
			!legacyAdapter && settings.prerenderer ? undefined : 'astro/entrypoints/prerender',
		serverEntry: legacyAdapter
			? {
					id: LEGACY_SSR_ENTRY_VIRTUAL_MODULE,
					resolvedId: RESOLVED_LEGACY_SSR_ENTRY_VIRTUAL_MODULE,
				}
			: undefined,
		get headInlineScripts() {
			return settings.scripts.flatMap((script) =>
				script.stage === 'head-inline' ? [script.content] : [],
			);
		},
		parallelPrerender: config.experimental.parallelPrerender,
		redirectPage: config.experimental.redirectPage,
		environments: {
			[IMAGE_SERVICE_ENVIRONMENT_NAME]: getImageServiceEnvironmentOptions(settings),
		},
		prerenderConflictBehavior: config.prerenderConflictBehavior,
		timer: settings.timer,
		validatePrerenderedRoute(route) {
			// i18n domains won't work with prerendered routes
			const hasI18nDomains =
				settings.buildOutput === 'server' &&
				config.i18n?.domains &&
				Object.keys(config.i18n.domains).length > 0;
			if (hasI18nDomains) {
				throw new AstroError({
					...NoPrerenderedRoutesWithDomains,
					message: NoPrerenderedRoutesWithDomains.message(route.component),
				});
			}
		},
		plugins(internals, options) {
			return [
				vitePluginActionsBuild(internals),
				pluginImageServiceEntry(),
				...pluginSSR(adapter, options.buildOutput, internals),
				...(config.experimental.incrementalBuild
					? [pluginIncremental(internals, config.root)]
					: []),
			];
		},
		setupViteConfig(vite, pages) {
			return runHookBuildSetup({ config, pages, vite, target: 'server', logger });
		},
		chunkPostHooks: [
			{
				marker: LINKS_PLACEHOLDER,
				run: (params, internals) =>
					contentAssetsBuildPostHook(config.base, config.build.assetsPrefix, internals, params),
			},
		],
		manifestFields: (internals, clientRoot, clientFiles) =>
			getManifestFields(settings, internals, clientRoot, clientFiles),
		async onServerManifest(manifest, middlewareEntryPoint) {
			const middlewareMode = resolveMiddlewareMode(adapter?.adapterFeatures);
			await runHookBuildSsr({
				config,
				manifest,
				logger,
				middlewareEntryPoint: middlewareMode === 'edge' ? middlewareEntryPoint : undefined,
			});
		},
		async onGenerated(routeToHeaders, dir) {
			await runHookBuildGenerated({
				settings,
				logger,
				dir,
				routeToHeaders: new Map(
					Array.from(routeToHeaders, ([pathname, { headers, route }]) => [
						pathname,
						{ headers, route: toIntegrationResolvedRoute(route, config.trailingSlash) },
					]),
				),
			});
		},
		async loadIncrementalCache(internals, options) {
			if (!config.experimental.incrementalBuild) return null;
			const [configHash, lockfileHash, keyDigest] = await Promise.all([
				computeConfigHash(config),
				computeLockfileHash(fileURLToPath(config.root)),
				options.key.then(hashCryptoKey),
			]);
			return IncrementalBuildCache.load(
				config.cacheDir,
				configHash,
				lockfileHash,
				keyDigest,
				internals.contentEntryRenderHashes ?? new Map(),
				options.force,
			);
		},
	};
}

async function getManifestFields(
	settings: AstroSettings,
	internals: BuildInternals,
	clientRoot: URL,
	clientFiles: Set<string>,
): Promise<BuildManifestHostFields> {
	let csp: SSRManifestCSP | undefined = undefined;

	if (shouldTrackCspHashes(settings.config.security.csp)) {
		const cspConfig = settings.config.security.csp;
		const algorithm = getAlgorithm(cspConfig);
		// Astro's generated hashes are element hashes. They are appended to the directive's `hashes`
		// as `default`-kind entries (bare strings), so they land on `script-src`/`style-src` and are
		// folded into the `-elem` directives at render time.
		const scriptHashes = [
			...getScriptHashes(cspConfig),
			...(await trackScriptHashes({ internals, settings, algorithm })),
		];
		const styleHashes = [
			...getStyleHashes(cspConfig),
			...settings.injectedCsp.styleHashes,
			...(await trackStyleHashes({ internals, settings, algorithm })),
		];

		let importMapContent: string | undefined;
		if (getStrictDynamic(cspConfig)) {
			const assetQueryParams = settings.adapter?.client?.assetQueryParams;
			const scriptIntegrity = await trackScriptIntegrity({
				settings,
				algorithm,
				clientRoot,
				clientFiles,
				assetQueryString: assetQueryParams ? assetQueryParams.toString() : undefined,
			});
			if (scriptIntegrity) {
				importMapContent = scriptIntegrity.importMapContent;
				scriptHashes.push(...scriptIntegrity.hashes);
			}
		}

		// When both CSP and clientPrerender are enabled, generate a static speculation rules
		// script whose hash can be included in the CSP policy. Dynamic per-URL injection would
		// produce unpredictable hashes that cannot be whitelisted at build time.
		let speculationRulesContent: string | undefined;
		if (settings.config.experimental.clientPrerender && settings.config.prefetch) {
			const prefetchAll =
				typeof settings.config.prefetch === 'object'
					? (settings.config.prefetch.prefetchAll ?? false)
					: false;
			speculationRulesContent = generateSpeculationRulesContent(prefetchAll);
			const speculationRulesHash = await generateCspDigest(speculationRulesContent, algorithm);
			scriptHashes.push(speculationRulesHash);
		}

		const scriptDirective = {
			resources: getScriptResources(cspConfig),
			hashes: scriptHashes,
			strictDynamic: getStrictDynamic(cspConfig),
		};
		const styleDirective = {
			resources: getStyleResources(cspConfig),
			hashes: styleHashes,
		};
		// Derive the deprecated flat fields from the `default`-kind entries for back-compat.
		const scriptDefault = partitionByKind(scriptDirective).default;
		const styleDefault = partitionByKind(styleDirective).default;

		csp = {
			cspDestination: settings.adapter?.adapterFeatures?.staticHeaders ? 'adapter' : undefined,
			algorithm,
			directives: getDirectives(settings),
			scriptHashes: scriptDefault.hashes,
			scriptResources: scriptDefault.resources,
			isStrictDynamic: scriptDirective.strictDynamic,
			styleHashes: styleDefault.hashes,
			styleResources: styleDefault.resources,
			scriptDirective,
			styleDirective,
			speculationRulesContent,
			importMapContent,
		};
	}

	// Get internal fetch headers from adapter config
	let internalFetchHeaders: Record<string, string> | undefined = undefined;
	if (settings.adapter?.client?.internalFetchHeaders) {
		const headers =
			typeof settings.adapter.client.internalFetchHeaders === 'function'
				? settings.adapter.client.internalFetchHeaders()
				: settings.adapter.client.internalFetchHeaders;
		if (Object.keys(headers).length > 0) {
			internalFetchHeaders = headers;
		}
	}

	return {
		middlewareMode: resolveMiddlewareMode(settings.adapter?.adapterFeatures),
		clientDirectives: Array.from(settings.clientDirectives),
		userAssetsBase: settings.config?.vite?.base,
		csp,
		internalFetchHeaders,
		logLevel: settings.logLevel,
		shouldInjectCspMetaTags: shouldTrackCspHashes(settings.config.security.csp),
	};
}
