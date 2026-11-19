import { fileURLToPath } from 'node:url';
import { glob } from 'tinyglobby';
import { getAssetsPrefix } from '../../../assets/utils/getAssetsPrefix.js';
import { SERIALIZED_MANIFEST_RESOLVED_ID } from '../../constants.js';
import { BEFORE_HYDRATION_SCRIPT_ID } from '@astrojs/vite-plugin-astro/_internal/vite-plugin-scripts/index.js';
import { serializeRouteData } from '../../app/manifest.js';
import type { SerializedRouteInfo, SerializedSSRManifest } from '../../app/types.js';
import { encodeKey } from '@astrojs/runtime/_internal/core/encryption.js';
import { fileExtension, joinPaths, prependForwardSlash } from '@astrojs/internal-helpers/path';
import { DEFAULT_COMPONENTS } from '../../routing/default.js';
import { getOutFile, getOutFolder } from '../common.js';
import type { BuildInternals } from '../internal.js';
import { cssOrder, mergeInlineCss } from '../runtime.js';
import type { ExtractedChunk, StaticBuildOptions } from '../types.js';
import { makePageDataKey } from '../../../../core/build/plugins/util.js';

/**
 * Unified manifest system architecture:
 *
 * The serialized manifest (virtual:astro:manifest) is now the single source of truth
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

import { MANIFEST_REPLACE } from '../../constants.js';

export { MANIFEST_REPLACE };
// Backtick included: Rolldown's minifier may rewrite string literals as template literals.
const replaceExp = new RegExp(`['"\`]${MANIFEST_REPLACE}['"\`]`, 'g');

/**
 * Post-build hook that injects the computed manifest into bundled chunks.
 * Finds the serialized manifest chunk and replaces the placeholder token with real data.
 */
export async function manifestBuildPostHook(
	options: StaticBuildOptions,
	internals: BuildInternals,
	{
		chunks,
		mutate,
	}: {
		chunks: ExtractedChunk[];
		mutate: (fileName: string, code: string, prerender: boolean) => void;
	},
) {
	const manifest = await createManifest(options, internals);

	// Find SSR manifest chunk (prerender: false)
	const ssrManifestChunk = chunks.find(
		(c) => !c.prerender && c.moduleIds.includes(SERIALIZED_MANIFEST_RESOLVED_ID),
	);

	if (ssrManifestChunk) {
		await options.host.onServerManifest(manifest, internals.middlewareEntryPoint);
		// Prerendered routes' styles are dead weight in the SSR manifest: the static
		// HTML on disk already has them inlined, and the SSR worker never renders
		// these routes. Stripping keeps the entry chunk small on platforms like
		// Cloudflare Workers that re-parse it on every cold isolate start.
		let ssrManifest = stripPrerenderedRouteStyles(manifest);
		ssrManifest = stripPrerenderOnlyEntryModules(ssrManifest, internals);
		const code = injectManifest(ssrManifest, ssrManifestChunk.code);
		mutate(ssrManifestChunk.fileName, code, false);
	}

	// Find prerender manifest chunk
	const prerenderManifestChunk = chunks.find(
		(c) => c.prerender && c.moduleIds.includes(SERIALIZED_MANIFEST_RESOLVED_ID),
	);

	if (prerenderManifestChunk) {
		const code = injectManifest(manifest, prerenderManifestChunk.code);
		mutate(prerenderManifestChunk.fileName, code, true);
	}
}

async function createManifest(
	buildOpts: StaticBuildOptions,
	internals: BuildInternals,
): Promise<SerializedSSRManifest> {
	// Add assets from the client build.
	const clientStatics = new Set(
		await glob('**/*', {
			cwd: fileURLToPath(buildOpts.outputDirectories.client),
		}),
	);
	for (const file of clientStatics) {
		internals.staticFiles.add(file);
	}

	// Also include SSR-emitted assets (CSS, fonts, images) tracked in ssrAssetsPerEnvironment.
	// These assets are moved to the client directory by ssrMoveAssets() later in the pipeline,
	// so they haven't landed on disk yet when we glob above. Without this, adapters in middleware
	// mode won't recognize them as static files and will match them against catch-all routes instead.
	// See: https://github.com/withastro/astro/issues/16039
	for (const [, ssrAssets] of internals.ssrAssetsPerEnvironment) {
		for (const asset of ssrAssets) {
			internals.staticFiles.add(asset);
		}
	}

	const staticFiles = internals.staticFiles;
	const encodedKey = await encodeKey(await buildOpts.key);
	const manifest = await buildManifest(
		buildOpts,
		internals,
		Array.from(staticFiles),
		encodedKey,
		clientStatics,
	);
	return manifest;
}

/**
 * Injects the manifest into the given code string. Returns the new code.
 */
function injectManifest(manifest: SerializedSSRManifest, code: string) {
	return code.replace(replaceExp, () => {
		return JSON.stringify(manifest);
	});
}

/**
 * Returns a copy of the manifest with `styles` cleared on every prerendered
 * route. Inline CSS for prerendered routes is dead weight in the SSR manifest:
 * the prerendered HTML on disk already contains the `<style>` tags, and the
 * SSR worker never renders these routes.
 */
function stripPrerenderedRouteStyles(manifest: SerializedSSRManifest): SerializedSSRManifest {
	let stripped = false;
	const routes = manifest.routes.map((route) => {
		if (!route.routeData.prerender || route.styles.length === 0) return route;
		stripped = true;
		return { ...route, styles: [] };
	});
	return stripped ? { ...manifest, routes } : manifest;
}

/**
 * Returns a copy of the manifest with `entryModules` entries removed for
 * specifiers that were only emitted by the prerender environment. Those
 * chunks live in the prerender output directory, which is deleted after
 * page generation, so referencing them from the SSR manifest would produce
 * dangling asset URLs at runtime.
 */
function stripPrerenderOnlyEntryModules(
	manifest: SerializedSSRManifest,
	internals: BuildInternals,
): SerializedSSRManifest {
	if (internals.prerenderOnlyEntrySpecifiers.size === 0) return manifest;
	const filtered = Object.fromEntries(
		Object.entries(manifest.entryModules).filter(
			([key]) => !internals.prerenderOnlyEntrySpecifiers.has(key),
		),
	);
	return { ...manifest, entryModules: filtered };
}

async function buildManifest(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	staticFiles: string[],
	encodedKey: string,
	clientFiles: Set<string>,
): Promise<SerializedSSRManifest> {
	const { config, host } = opts;

	const routes: SerializedRouteInfo[] = [];
	const rawEntryModules = Object.fromEntries(internals.entrySpecifierToBundleMap.entries());

	const assetQueryParams = host.adapter?.client?.assetQueryParams;
	const assetQueryString = assetQueryParams ? assetQueryParams.toString() : undefined;

	const appendAssetQuery = (pth: string) => (assetQueryString ? `${pth}?${assetQueryString}` : pth);
	const entryModules = Object.fromEntries(
		Object.entries(rawEntryModules).map(([key, value]) => [
			key,
			value ? appendAssetQuery(value) : value,
		]),
	);
	const pageScripts = internals.routerRegistry!.getPageScripts('build');
	for (const specifier of pageScripts) {
		staticFiles.push(rawEntryModules[specifier]);
	}

	const prefixAssetPath = (pth: string) => {
		let result = '';
		if (config.build.assetsPrefix) {
			const pf = getAssetsPrefix(fileExtension(pth), config.build.assetsPrefix);
			result = joinPaths(pf, pth);
		} else {
			result = prependForwardSlash(joinPaths(config.base, pth));
		}
		if (assetQueryString) {
			result += '?' + assetQueryString;
		}
		return result;
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
			routeData: serializeRouteData(route, config.trailingSlash),
		});
	}

	for (const route of opts.routesList.routes) {
		const pageData = internals.pagesByKeys.get(makePageDataKey(route.route, route.component));
		if (!pageData) continue;

		const scripts: SerializedRouteInfo['scripts'] = [];
		for (const specifier of pageScripts) {
			scripts.push({
				type: 'external',
				value: appendAssetQuery(rawEntryModules[specifier]),
			});
		}

		// may be used in the future for handling rel=modulepreload, rel=icon, rel=manifest etc.
		const links: [] = [];

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
				...host.headInlineScripts.map((content) => ({
					stage: 'head-inline' as const,
					children: content,
				})),
			],
			styles,
			routeData: serializeRouteData(route, config.trailingSlash),
		});

		// Add the built .html file as a staticFile
		if (route.prerender && route.pathname) {
			const outFolder = getOutFolder({
				outRoot: opts.outputDirectories.client,
				buildFormat: config.build.format,
				pathname: route.pathname,
				routeData: route,
			});
			const outFile = getOutFile(config.build.format, outFolder, route.pathname, route);
			const file = outFile.toString().replace(opts.outputDirectories.client.toString(), '');
			staticFiles.push(file);
		}
	}

	// HACK! Patch this special one.
	if (!(BEFORE_HYDRATION_SCRIPT_ID in entryModules)) {
		// Set this to an empty string so that the runtime knows not to try and load this.
		entryModules[BEFORE_HYDRATION_SCRIPT_ID] = '';
	}
	const serverLike = opts.buildOutput === 'server';

	return {
		...internals.routerRegistry!.serializeManifestData(),
		...(await host.manifestFields(internals, opts.outputDirectories.client, clientFiles)),
		rootDir: config.root.toString(),
		cacheDir: config.cacheDir.toString(),
		outDir: config.outDir.toString(),
		srcDir: config.srcDir.toString(),
		publicDir: config.publicDir.toString(),
		buildClientDir: opts.outputDirectories.client.toString(),
		buildServerDir: opts.outputDirectories.server.toString(),
		adapterName: host.adapter?.name ?? '',
		assetsDir: config.build.assets,
		routes,
		serverLike,
		site: config.site,
		base: config.base,
		trailingSlash: config.trailingSlash,
		compressHTML: config.compressHTML,
		assetsPrefix: config.build.assetsPrefix,
		componentMetadata: Array.from(internals.componentMetadata),
		renderers: [],
		entryModules,
		inlinedScripts: Array.from(internals.inlinedScripts),
		assets: staticFiles.map(prefixAssetPath).sort(),
		buildFormat: config.build.format,
		runtimeMode: 'production',
		checkOrigin: config.security.checkOrigin && serverLike,
		serverIslandBodySizeLimit:
			config.security.serverIslandBodySizeLimit && serverLike
				? config.security.serverIslandBodySizeLimit
				: 1024 * 1024,
		allowedDomains: config.security.allowedDomains,
		key: encodedKey,
		devToolbar: {
			enabled: false,
			latestAstroVersion: undefined,
			debugInfoOutput: '',
			placement: undefined,
		},
	};
}
