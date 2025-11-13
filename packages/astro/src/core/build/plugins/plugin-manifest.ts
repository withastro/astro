import { fileURLToPath } from 'node:url';
import type { OutputChunk } from 'rollup';
import { glob } from 'tinyglobby';
import type { Plugin as VitePlugin } from 'vite';
import { getAssetsPrefix } from '../../../assets/utils/getAssetsPrefix.js';
import { normalizeTheLocale } from '../../../i18n/index.js';
import { runHookBuildSsr } from '../../../integrations/hooks.js';
import {
	SERIALIZED_MANIFEST_RESOLVED_ID,
} from '../../../manifest/serialized.js';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../../vite-plugin-scripts/index.js';
import { toFallbackType } from '../../app/common.js';
import { serializeRouteData, toRoutingStrategy } from '../../app/index.js';
import type {
	SerializedRouteInfo,
	SerializedSSRManifest,
	SSRManifestCSP,
	SSRManifestI18n,
} from '../../app/types.js';
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
import { type BuildInternals, cssOrder, mergeInlineCss } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
import { makePageDataKey } from './util.js';

/**
 * Unified manifest system architecture:
 *
 * The serialized manifest (virtual:astro:serialized-manifest) is now the single source of truth
 * for both dev and production builds:
 *
 * - In dev: The serialized manifest is used directly (pre-computed manifest data)
 * - In prod: Two-stage process:
 *   1. serialized.ts emits a placeholder (MANIFEST_REPLACE token) during bundling
 *   2. plugin-manifest injects the real build-specific data at the end
 *
 * This flow eliminates dual virtual modules and simplifies the architecture:
 * - pluginManifestBuild: Registers SERIALIZED_MANIFEST_ID as Vite input
 * - pluginManifestBuild.generateBundle: Tracks the serialized manifest chunk filename
 * - manifestBuildPostHook: Finds the chunk, computes final manifest data, and replaces the token
 *
 * The placeholder mechanism allows serialized.ts to emit during vite build without knowing
 * the final build-specific data (routes, assets, CSP hashes, etc) that's only available
 * after bundling completes.
 */

export const MANIFEST_REPLACE = '@@ASTRO_MANIFEST_REPLACE@@';
const replaceExp = new RegExp(`['"]${MANIFEST_REPLACE}['"]`, 'g');

/**
 * Low-level Vite plugin that handles:
 * - Registering the serialized manifest as a build input
 * - Tracking the manifest chunk filename for later injection
 * - Ensuring manifest chunk always rebuilds (cache busting via augmentChunkHash)
 *
 * Does NOT handle the actual manifest computation or injection - that's done in manifestBuildPostHook
 */
export function pluginManifestBuild(internals: BuildInternals): VitePlugin {
	return {
		name: '@astro/plugin-manifest-build',
		enforce: 'post',
		applyToEnvironment(environment) {
			return environment.name === 'ssr' || environment.name === 'prerender';
		},

		augmentChunkHash(chunkInfo) {
			if (chunkInfo.facadeModuleId === SERIALIZED_MANIFEST_RESOLVED_ID) {
				return Date.now().toString();
			}
		},

		async generateBundle(_opts, bundle) {
			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'asset') {
					continue;
				}
				if (chunk.facadeModuleId === SERIALIZED_MANIFEST_RESOLVED_ID) {
					internals.manifestFileName = chunkName;
				}
			}
		},
	};
}

/**
 * Post-build hook that injects the computed manifest into bundled chunks.
 * Finds the serialized manifest chunk and replaces the placeholder token with real data.
 */
export async function manifestBuildPostHook(
	options: StaticBuildOptions,
	internals: BuildInternals,
	{ ssrOutputs, prerenderOutputs, mutate }: any,
) {
	let manifestEntryChunk: OutputChunk | undefined;

	// Find the serialized manifest chunk in SSR outputs
	for (const output of ssrOutputs) {
		for (const chunk of output.output) {
			if (chunk.type === 'asset') {
				continue;
			}
			if (chunk.code && chunk.moduleIds.includes(SERIALIZED_MANIFEST_RESOLVED_ID)) {
				manifestEntryChunk = chunk as OutputChunk;
				break;
			}
		}
		if (manifestEntryChunk) {
			break;
		}
	}

	if (!manifestEntryChunk) {
		throw new Error(`Did not find serialized manifest chunk for SSR`);
	}

	const manifest = await createManifest(options, internals);
	const shouldPassMiddlewareEntryPoint =
		options.settings.adapter?.adapterFeatures?.edgeMiddleware;
	await runHookBuildSsr({
		config: options.settings.config,
		manifest,
		logger: options.logger,
		middlewareEntryPoint: shouldPassMiddlewareEntryPoint
			? internals.middlewareEntryPoint
			: undefined,
	});
	const code = injectManifest(manifest, manifestEntryChunk);
	mutate(manifestEntryChunk, ['server'], code);

	// Also inject manifest into prerender outputs if available
	if (prerenderOutputs) {
		let prerenderManifestChunk: OutputChunk | undefined;
		for (const output of prerenderOutputs) {
			for (const chunk of output.output) {
				if (chunk.type === 'asset') {
					continue;
				}
				if (chunk.code && chunk.moduleIds.includes(SERIALIZED_MANIFEST_RESOLVED_ID)) {
					prerenderManifestChunk = chunk as OutputChunk;
					break;
				}
			}
			if (prerenderManifestChunk) {
				break;
			}
		}
		if (prerenderManifestChunk) {
			const prerenderCode = injectManifest(manifest, prerenderManifestChunk);
			mutate(prerenderManifestChunk, ['server'], prerenderCode);
		}
	}
}

async function createManifest(
	buildOpts: StaticBuildOptions,
	internals: BuildInternals,
): Promise<SerializedSSRManifest> {
	// Add assets from the client build.
	const clientStatics = new Set(
		await glob('**/*', {
			cwd: fileURLToPath(buildOpts.settings.config.build.client),
		}),
	);
	for (const file of clientStatics) {
		internals.staticFiles.add(file);
	}

	const staticFiles = internals.staticFiles;
	const encodedKey = await encodeKey(await buildOpts.key);
	return await buildManifest(buildOpts, internals, Array.from(staticFiles), encodedKey);
}

/**
 * It injects the manifest in the given output rollup chunk. It returns the new emitted code
 */
function injectManifest(manifest: SerializedSSRManifest, chunk: Readonly<OutputChunk>) {
	const code = chunk.code;

	return code.replace(replaceExp, () => {
		return JSON.stringify(manifest);
	});
}

async function buildManifest(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	staticFiles: string[],
	encodedKey: string,
): Promise<SerializedSSRManifest> {
	const { settings } = opts;

	const routes: SerializedRouteInfo[] = [];
	const domainLookupTable: Record<string, string> = {};
	const entryModules = Object.fromEntries(internals.entrySpecifierToBundleMap.entries());
	if (settings.scripts.some((script) => script.stage === 'page')) {
		staticFiles.push(entryModules[PAGE_SCRIPT_ID]);
	}

	const prefixAssetPath = (pth: string) => {
		if (settings.config.build.assetsPrefix) {
			const pf = getAssetsPrefix(fileExtension(pth), settings.config.build.assetsPrefix);
			return joinPaths(pf, pth);
		} else {
			return prependForwardSlash(joinPaths(settings.config.base, pth));
		}
	};

	// Default components follow a special flow during build. We prevent their processing earlier
	// in the build. As a result, they are not present on `internals.pagesByKeys` and not serialized
	// in the manifest file. But we need them in the manifest, so we handle them here
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
		if (!route.prerender) continue;
		if (!route.pathname) continue;

		const outFolder = getOutFolder(opts.settings, route.pathname, route);
		const outFile = getOutFile(opts.settings.config, outFolder, route.pathname, route);
		const file = outFile.toString().replace(opts.settings.config.build.client.toString(), '');
		routes.push({
			file,
			links: [],
			scripts: [],
			styles: [],
			routeData: serializeRouteData(route, settings.config.trailingSlash),
		});
		staticFiles.push(file);
	}

	const needsStaticHeaders = settings.adapter?.adapterFeatures?.experimentalStaticHeaders ?? false;

	for (const route of opts.routesList.routes) {
		const pageData = internals.pagesByKeys.get(makePageDataKey(route.route, route.component));
		if (!pageData) continue;

		if (route.prerender && route.type !== 'redirect' && !needsStaticHeaders) {
			continue;
		}
		const scripts: SerializedRouteInfo['scripts'] = [];
		if (settings.scripts.some((script) => script.stage === 'page')) {
			const src = entryModules[PAGE_SCRIPT_ID];

			scripts.push({
				type: 'external',
				value: prefixAssetPath(src),
			});
		}

		// may be used in the future for handling rel=modulepreload, rel=icon, rel=manifest etc.
		const links: [] = [];

		const styles = pageData.styles
			.sort(cssOrder)
			.map(({ sheet }) => sheet)
			.map((s) => (s.type === 'external' ? { ...s, src: prefixAssetPath(s.src) } : s))
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
	}

	/**
	 * logic meant for i18n domain support, where we fill the lookup table
	 */
	const i18n = settings.config.i18n;
	if (i18n && i18n.domains) {
		for (const [locale, domainValue] of Object.entries(i18n.domains)) {
			domainLookupTable[domainValue] = normalizeTheLocale(locale);
		}
	}

	// HACK! Patch this special one.
	if (!(BEFORE_HYDRATION_SCRIPT_ID in entryModules)) {
		// Set this to an empty string so that the runtime knows not to try and load this.
		entryModules[BEFORE_HYDRATION_SCRIPT_ID] = '';
	}
	let i18nManifest: SSRManifestI18n | undefined = undefined;
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

	let csp: SSRManifestCSP | undefined = undefined;

	if (shouldTrackCspHashes(settings.config.experimental.csp)) {
		const algorithm = getAlgorithm(settings.config.experimental.csp);
		const scriptHashes = [
			...getScriptHashes(settings.config.experimental.csp),
			...(await trackScriptHashes(internals, settings, algorithm)),
		];
		const styleHashes = [
			...getStyleHashes(settings.config.experimental.csp),
			...settings.injectedCsp.styleHashes,
			...(await trackStyleHashes(internals, settings, algorithm)),
		];

		csp = {
			cspDestination: settings.adapter?.adapterFeatures?.experimentalStaticHeaders
				? 'adapter'
				: undefined,
			scriptHashes,
			scriptResources: getScriptResources(settings.config.experimental.csp),
			styleHashes,
			styleResources: getStyleResources(settings.config.experimental.csp),
			algorithm,
			directives: getDirectives(settings),
			isStrictDynamic: getStrictDynamic(settings.config.experimental.csp),
		};
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
		routes,
		site: settings.config.site,
		base: settings.config.base,
		userAssetsBase: settings.config?.vite?.base,
		trailingSlash: settings.config.trailingSlash,
		compressHTML: settings.config.compressHTML,
		assetsPrefix: settings.config.build.assetsPrefix,
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
		allowedDomains: settings.config.security?.allowedDomains,
		serverIslandNameMap: Array.from(settings.serverIslandNameMap),
		key: encodedKey,
		sessionConfig: settings.config.session,
		csp,
		devToolbar: {
			enabled: false,
			latestAstroVersion: settings.latestAstroVersion,
			debugInfoOutput: '',
		},
	};
}
