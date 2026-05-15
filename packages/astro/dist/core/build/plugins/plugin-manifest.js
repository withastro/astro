import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';
import { getAssetsPrefix } from '../../../assets/utils/getAssetsPrefix.js';
import { normalizeTheLocale } from '../../../i18n/index.js';
import { resolveMiddlewareMode } from '../../../integrations/adapter-utils.js';
import { runHookBuildSsr } from '../../../integrations/hooks.js';
import { SERIALIZED_MANIFEST_RESOLVED_ID } from '../../../manifest/serialized.js';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../../vite-plugin-scripts/index.js';
import { toFallbackType } from '../../app/common.js';
import { serializeRouteData, toRoutingStrategy } from '../../app/entrypoints/index.js';
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
	trackStyleHashes,
} from '../../csp/common.js';
import { encodeKey } from '../../encryption.js';
import { fileExtension, joinPaths, prependForwardSlash } from '../../path.js';
import { DEFAULT_COMPONENTS } from '../../routing/default.js';
import { getOutFile, getOutFolder } from '../common.js';
import { cssOrder, mergeInlineCss } from '../runtime.js';
import { makePageDataKey } from './util.js';
import { cacheConfigToManifest } from '../../cache/utils.js';
import { sessionConfigToManifest } from '../../session/utils.js';
const MANIFEST_REPLACE = '@@ASTRO_MANIFEST_REPLACE@@';
const replaceExp = new RegExp(`['"]${MANIFEST_REPLACE}['"]`, 'g');
async function manifestBuildPostHook(options, internals, { chunks, mutate }) {
	const manifest = await createManifest(options, internals);
	const ssrManifestChunk = chunks.find(
		(c) => !c.prerender && c.moduleIds.includes(SERIALIZED_MANIFEST_RESOLVED_ID),
	);
	if (ssrManifestChunk) {
		const middlewareMode = resolveMiddlewareMode(options.settings.adapter?.adapterFeatures);
		const shouldPassMiddlewareEntryPoint = middlewareMode === 'edge';
		await runHookBuildSsr({
			config: options.settings.config,
			manifest,
			logger: options.logger,
			middlewareEntryPoint: shouldPassMiddlewareEntryPoint
				? internals.middlewareEntryPoint
				: void 0,
		});
		const ssrManifest = stripPrerenderedRouteStyles(manifest);
		const code = injectManifest(ssrManifest, ssrManifestChunk.code);
		mutate(ssrManifestChunk.fileName, code, false);
	}
	const prerenderManifestChunk = chunks.find(
		(c) => c.prerender && c.moduleIds.includes(SERIALIZED_MANIFEST_RESOLVED_ID),
	);
	if (prerenderManifestChunk) {
		const code = injectManifest(manifest, prerenderManifestChunk.code);
		mutate(prerenderManifestChunk.fileName, code, true);
	}
}
async function createManifest(buildOpts, internals) {
	const clientStatics = new Set(
		await glob('**/*', {
			cwd: fileURLToPath(buildOpts.settings.config.build.client),
		}),
	);
	for (const file of clientStatics) {
		internals.staticFiles.add(file);
	}
	for (const [, ssrAssets] of internals.ssrAssetsPerEnvironment) {
		for (const asset of ssrAssets) {
			internals.staticFiles.add(asset);
		}
	}
	const staticFiles = internals.staticFiles;
	const encodedKey = await encodeKey(await buildOpts.key);
	const manifest = await buildManifest(buildOpts, internals, Array.from(staticFiles), encodedKey);
	return manifest;
}
function injectManifest(manifest, code) {
	return code.replace(replaceExp, () => {
		return JSON.stringify(manifest);
	});
}
function stripPrerenderedRouteStyles(manifest) {
	let stripped = false;
	const routes = manifest.routes.map((route) => {
		if (!route.routeData.prerender || route.styles.length === 0) return route;
		stripped = true;
		return { ...route, styles: [] };
	});
	return stripped ? { ...manifest, routes } : manifest;
}
async function buildManifest(opts, internals, staticFiles, encodedKey) {
	const { settings } = opts;
	const routes = [];
	const domainLookupTable = {};
	const rawEntryModules = Object.fromEntries(internals.entrySpecifierToBundleMap.entries());
	const assetQueryParams = settings.adapter?.client?.assetQueryParams;
	const assetQueryString = assetQueryParams ? assetQueryParams.toString() : void 0;
	const appendAssetQuery = (pth) => (assetQueryString ? `${pth}?${assetQueryString}` : pth);
	const entryModules = Object.fromEntries(
		Object.entries(rawEntryModules).map(([key, value]) => [
			key,
			value ? appendAssetQuery(value) : value,
		]),
	);
	if (settings.scripts.some((script) => script.stage === 'page')) {
		staticFiles.push(rawEntryModules[PAGE_SCRIPT_ID]);
	}
	const prefixAssetPath = (pth) => {
		let result = '';
		if (settings.config.build.assetsPrefix) {
			const pf = getAssetsPrefix(fileExtension(pth), settings.config.build.assetsPrefix);
			result = joinPaths(pf, pth);
		} else {
			result = prependForwardSlash(joinPaths(settings.config.base, pth));
		}
		if (assetQueryString) {
			result += '?' + assetQueryString;
		}
		return result;
	};
	for (const route of opts.routesList.routes) {
		if (!DEFAULT_COMPONENTS.find((component) => route.component === component)) {
			continue;
		}
		routes.push({
			file: '',
			links: [],
			scripts: [],
			styles: [],
			routeData: serializeRouteData(route, settings.config.trailingSlash),
		});
	}
	for (const route of opts.routesList.routes) {
		const pageData = internals.pagesByKeys.get(makePageDataKey(route.route, route.component));
		if (!pageData) continue;
		const scripts = [];
		if (settings.scripts.some((script) => script.stage === 'page')) {
			const src = rawEntryModules[PAGE_SCRIPT_ID];
			scripts.push({
				type: 'external',
				value: appendAssetQuery(src),
			});
		}
		const links = [];
		const styles = pageData.styles
			.sort(cssOrder)
			.map(({ sheet }) => sheet)
			.map((s) => (s.type === 'external' ? { ...s, src: appendAssetQuery(s.src) } : s))
			.reduce(mergeInlineCss, []);
		routes.push({
			file: '',
			links,
			scripts: [
				...scripts,
				...settings.scripts
					.filter((script) => script.stage === 'head-inline')
					.map(({ stage, content }) => ({ stage, children: content })),
			],
			styles,
			routeData: serializeRouteData(route, settings.config.trailingSlash),
		});
		if (route.prerender && route.pathname) {
			const outFolder = getOutFolder(opts.settings, route.pathname, route);
			const outFile = getOutFile(
				opts.settings.config.build.format,
				outFolder,
				route.pathname,
				route,
			);
			const file = outFile.toString().replace(opts.settings.config.build.client.toString(), '');
			staticFiles.push(file);
		}
	}
	const i18n = settings.config.i18n;
	if (i18n && i18n.domains) {
		for (const [locale, domainValue] of Object.entries(i18n.domains)) {
			domainLookupTable[domainValue] = normalizeTheLocale(locale);
		}
	}
	if (!(BEFORE_HYDRATION_SCRIPT_ID in entryModules)) {
		entryModules[BEFORE_HYDRATION_SCRIPT_ID] = '';
	}
	let i18nManifest = void 0;
	if (settings.config.i18n) {
		i18nManifest = {
			fallback: settings.config.i18n.fallback,
			fallbackType: toFallbackType(settings.config.i18n.routing),
			strategy: toRoutingStrategy(settings.config.i18n.routing, settings.config.i18n.domains),
			locales: settings.config.i18n.locales,
			defaultLocale: settings.config.i18n.defaultLocale,
			domainLookupTable,
			domains: settings.config.i18n.domains,
		};
	}
	let csp = void 0;
	if (shouldTrackCspHashes(settings.config.security.csp)) {
		const algorithm = getAlgorithm(settings.config.security.csp);
		const scriptHashes = [
			...getScriptHashes(settings.config.security.csp),
			...(await trackScriptHashes(internals, settings, algorithm)),
		];
		const styleHashes = [
			...getStyleHashes(settings.config.security.csp),
			...settings.injectedCsp.styleHashes,
			...(await trackStyleHashes(internals, settings, algorithm)),
		];
		csp = {
			cspDestination: settings.adapter?.adapterFeatures?.staticHeaders ? 'adapter' : void 0,
			scriptHashes,
			scriptResources: getScriptResources(settings.config.security.csp),
			styleHashes,
			styleResources: getStyleResources(settings.config.security.csp),
			algorithm,
			directives: getDirectives(settings),
			isStrictDynamic: getStrictDynamic(settings.config.security.csp),
		};
	}
	let internalFetchHeaders = void 0;
	if (settings.adapter?.client?.internalFetchHeaders) {
		const headers =
			typeof settings.adapter.client.internalFetchHeaders === 'function'
				? settings.adapter.client.internalFetchHeaders()
				: settings.adapter.client.internalFetchHeaders;
		if (Object.keys(headers).length > 0) {
			internalFetchHeaders = headers;
		}
	}
	const middlewareMode = resolveMiddlewareMode(opts.settings.adapter?.adapterFeatures);
	let experimentalLogger = void 0;
	if (settings.config.experimental.logger) {
		experimentalLogger = settings.config.experimental.logger;
	}
	return {
		rootDir: opts.settings.config.root.toString(),
		cacheDir: opts.settings.config.cacheDir.toString(),
		outDir: opts.settings.config.outDir.toString(),
		srcDir: opts.settings.config.srcDir.toString(),
		publicDir: opts.settings.config.publicDir.toString(),
		buildClientDir: opts.settings.config.build.client.toString(),
		buildServerDir: opts.settings.config.build.server.toString(),
		adapterName: opts.settings.adapter?.name ?? '',
		assetsDir: opts.settings.config.build.assets,
		routes,
		serverLike: opts.settings.buildOutput === 'server',
		middlewareMode,
		site: settings.config.site,
		base: settings.config.base,
		userAssetsBase: settings.config?.vite?.base,
		trailingSlash: settings.config.trailingSlash,
		compressHTML: settings.config.compressHTML,
		assetsPrefix: settings.config.build.assetsPrefix,
		experimentalQueuedRendering: {
			enabled: settings.config.experimental.queuedRendering?.enabled ?? false,
			poolSize: 0,
			contentCache: false,
		},
		componentMetadata: Array.from(internals.componentMetadata),
		renderers: [],
		clientDirectives: Array.from(settings.clientDirectives),
		entryModules,
		inlinedScripts: Array.from(internals.inlinedScripts),
		assets: staticFiles.map(prefixAssetPath),
		i18n: i18nManifest,
		buildFormat: settings.config.build.format,
		checkOrigin:
			(settings.config.security?.checkOrigin && settings.buildOutput === 'server') ?? false,
		actionBodySizeLimit:
			settings.config.security?.actionBodySizeLimit && settings.buildOutput === 'server'
				? settings.config.security.actionBodySizeLimit
				: 1024 * 1024,
		serverIslandBodySizeLimit:
			settings.config.security?.serverIslandBodySizeLimit && settings.buildOutput === 'server'
				? settings.config.security.serverIslandBodySizeLimit
				: 1024 * 1024,
		allowedDomains: settings.config.security?.allowedDomains,
		key: encodedKey,
		sessionConfig: sessionConfigToManifest(settings.config.session),
		cacheConfig: cacheConfigToManifest(
			settings.config.experimental?.cache,
			settings.config.experimental?.routeRules,
		),
		csp,
		image: {
			objectFit: settings.config.image.objectFit,
			objectPosition: settings.config.image.objectPosition,
			layout: settings.config.image.layout,
		},
		devToolbar: {
			enabled: false,
			latestAstroVersion: void 0,
			debugInfoOutput: '',
			placement: void 0,
		},
		internalFetchHeaders,
		logLevel: settings.logLevel,
		shouldInjectCspMetaTags: shouldTrackCspHashes(settings.config.security.csp),
		experimentalLogger,
	};
}
export { MANIFEST_REPLACE, manifestBuildPostHook };
