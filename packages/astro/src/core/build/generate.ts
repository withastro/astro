import * as colors from 'kleur/colors';
import { bgGreen, black, cyan, dim, green, magenta } from 'kleur/colors';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { OutputAsset, OutputChunk } from 'rollup';
import type {
	AstroConfig,
	AstroSettings,
	ComponentInstance,
	GetStaticPathsItem,
	ImageTransform,
	MiddlewareEndpointHandler,
	RouteData,
	RouteType,
	SSRError,
	SSRLoadedRenderer,
	SSRManifest,
} from '../../@types/astro';
import {
	generateImage as generateImageInternal,
	getStaticImageList,
} from '../../assets/build/generate.js';
import { hasPrerenderedPages, type BuildInternals } from '../../core/build/internal.js';
import {
	isRelativePath,
	joinPaths,
	prependForwardSlash,
	removeLeadingForwardSlash,
	removeTrailingForwardSlash,
} from '../../core/path.js';
import { runHookBuildGenerated } from '../../integrations/index.js';
import { getOutputDirectory, isServerLikeOutput } from '../../prerender/utils.js';
import { PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { debug, info, Logger } from '../logger/core.js';
import { RedirectSinglePageBuiltModule, getRedirectLocationOrThrow } from '../redirects/index.js';
import { createRenderContext } from '../render/index.js';
import { callGetStaticPaths } from '../render/route-cache.js';
import {
	createAssetLink,
	createModuleScriptsSet,
	createStylesheetElementSet,
} from '../render/ssr-element.js';
import { createRequest } from '../request.js';
import { matchRoute } from '../routing/match.js';
import { getOutputFilename } from '../util.js';
import { getOutDirWithinCwd, getOutFile, getOutFolder } from './common.js';
import {
	cssOrder,
	getEntryFilePathFromComponentPath,
	getPageDataByComponent,
	mergeInlineCss,
} from './internal.js';
import type {
	PageBuildData,
	SinglePageBuiltModule,
	StaticBuildOptions,
	StylesheetAsset,
} from './types';
import { getTimeStat } from './util.js';
import { BuildPipeline } from './buildPipeline.js';
import type { BufferEncoding } from 'vfile';

function createEntryURL(filePath: string, outFolder: URL) {
	return new URL('./' + filePath + `?time=${Date.now()}`, outFolder);
}

async function getEntryForRedirectRoute(
	route: RouteData,
	internals: BuildInternals,
	outFolder: URL
): Promise<SinglePageBuiltModule> {
	if (route.type !== 'redirect') {
		throw new Error(`Expected a redirect route.`);
	}
	if (route.redirectRoute) {
		const filePath = getEntryFilePathFromComponentPath(internals, route.redirectRoute.component);
		if (filePath) {
			const url = createEntryURL(filePath, outFolder);
			const ssrEntryPage: SinglePageBuiltModule = await import(url.toString());
			return ssrEntryPage;
		}
	}

	return RedirectSinglePageBuiltModule;
}

function shouldSkipDraft(pageModule: ComponentInstance, settings: AstroSettings): boolean {
	return (
		// Drafts are disabled
		!settings.config.markdown.drafts &&
		// This is a draft post
		'frontmatter' in pageModule &&
		(pageModule as any).frontmatter?.draft === true
	);
}

// Gives back a facadeId that is relative to the root.
// ie, src/pages/index.astro instead of /Users/name..../src/pages/index.astro
export function rootRelativeFacadeId(facadeId: string, settings: AstroSettings): string {
	return facadeId.slice(fileURLToPath(settings.config.root).length);
}

// Determines of a Rollup chunk is an entrypoint page.
export function chunkIsPage(
	settings: AstroSettings,
	output: OutputAsset | OutputChunk,
	internals: BuildInternals
) {
	if (output.type !== 'chunk') {
		return false;
	}
	const chunk = output;
	if (chunk.facadeModuleId) {
		const facadeToEntryId = prependForwardSlash(
			rootRelativeFacadeId(chunk.facadeModuleId, settings)
		);
		return internals.entrySpecifierToBundleMap.has(facadeToEntryId);
	}
	return false;
}

export async function generatePages(opts: StaticBuildOptions, internals: BuildInternals) {
	const logger = new Logger(opts.logging);
	const timer = performance.now();
	const ssr = isServerLikeOutput(opts.settings.config);
	let manifest: SSRManifest;
	if (ssr) {
		manifest = await BuildPipeline.retrieveManifest(opts, internals);
	} else {
		const baseDirectory = getOutputDirectory(opts.settings.config);
		const renderersEntryUrl = new URL('renderers.mjs', baseDirectory);
		const renderers = await import(renderersEntryUrl.toString());
		manifest = createBuildManifest(
			opts.settings,
			internals,
			renderers.renderers as SSRLoadedRenderer[]
		);
	}
	const buildPipeline = new BuildPipeline(opts, internals, manifest);
	const outFolder = ssr
		? opts.settings.config.build.server
		: getOutDirWithinCwd(opts.settings.config.outDir);

	// HACK! `astro:assets` relies on a global to know if its running in dev, prod, ssr, ssg, full moon
	// If we don't delete it here, it's technically not impossible (albeit improbable) for it to leak
	if (ssr && !hasPrerenderedPages(internals)) {
		delete globalThis?.astroAsset?.addStaticImage;
		return;
	}

	const verb = ssr ? 'prerendering' : 'generating';
	info(opts.logging, null, `\n${bgGreen(black(` ${verb} static routes `))}`);
	const builtPaths = new Set<string>();
	const pagesToGenerate = buildPipeline.retrieveRoutesToGenerate();
	if (ssr) {
		for (const [pageData, filePath] of pagesToGenerate) {
			if (pageData.route.prerender) {
				const ssrEntryURLPage = createEntryURL(filePath, outFolder);
				const ssrEntryPage = await import(ssrEntryURLPage.toString());
				if (
					// TODO: remove in Astro 4.0
					opts.settings.config.build.split ||
					opts.settings.adapter?.adapterFeatures?.functionPerRoute
				) {
					// forcing to use undefined, so we fail in an expected way if the module is not even there.
					const ssrEntry = ssrEntryPage?.manifest?.pageModule;
					if (ssrEntry) {
						await generatePage(pageData, ssrEntry, builtPaths, buildPipeline, logger);
					} else {
						throw new Error(
							`Unable to find the manifest for the module ${ssrEntryURLPage.toString()}. This is unexpected and likely a bug in Astro, please report.`
						);
					}
				} else {
					const ssrEntry = ssrEntryPage as SinglePageBuiltModule;
					await generatePage(pageData, ssrEntry, builtPaths, buildPipeline, logger);
				}
			}
			if (pageData.route.type === 'redirect') {
				const entry = await getEntryForRedirectRoute(pageData.route, internals, outFolder);
				await generatePage(pageData, entry, builtPaths, buildPipeline, logger);
			}
		}
	} else {
		for (const [pageData, filePath] of pagesToGenerate) {
			if (pageData.route.type === 'redirect') {
				const entry = await getEntryForRedirectRoute(pageData.route, internals, outFolder);
				await generatePage(pageData, entry, builtPaths, buildPipeline, logger);
			} else {
				const ssrEntryURLPage = createEntryURL(filePath, outFolder);
				const entry: SinglePageBuiltModule = await import(ssrEntryURLPage.toString());

				await generatePage(pageData, entry, builtPaths, buildPipeline, logger);
			}
		}
	}

	info(opts.logging, null, `\n${bgGreen(black(` generating optimized images `))}`);
	for (const imageData of getStaticImageList()) {
		await generateImage(opts, imageData[1].options, imageData[1].path);
	}

	delete globalThis?.astroAsset?.addStaticImage;

	await runHookBuildGenerated({
		config: opts.settings.config,
		logging: opts.logging,
	});

	info(opts.logging, null, dim(`Completed in ${getTimeStat(timer, performance.now())}.\n`));
}

async function generateImage(opts: StaticBuildOptions, transform: ImageTransform, path: string) {
	let timeStart = performance.now();
	const generationData = await generateImageInternal(opts, transform, path);

	if (!generationData) {
		return;
	}

	const timeEnd = performance.now();
	const timeChange = getTimeStat(timeStart, timeEnd);
	const timeIncrease = `(+${timeChange})`;
	const statsText = generationData.cached
		? `(reused cache entry)`
		: `(before: ${generationData.weight.before}kb, after: ${generationData.weight.after}kb)`;
	info(opts.logging, null, `  ${green('▶')} ${path} ${dim(statsText)} ${dim(timeIncrease)}`);
}

async function generatePage(
	pageData: PageBuildData,
	ssrEntry: SinglePageBuiltModule,
	builtPaths: Set<string>,
	pipeline: BuildPipeline,
	logger: Logger
) {
	let timeStart = performance.now();

	const pageInfo = getPageDataByComponent(pipeline.getInternals(), pageData.route.component);

	// may be used in the future for handling rel=modulepreload, rel=icon, rel=manifest etc.
	const linkIds: [] = [];
	const scripts = pageInfo?.hoistedScript ?? null;
	const styles = pageData.styles
		.sort(cssOrder)
		.map(({ sheet }) => sheet)
		.reduce(mergeInlineCss, []);

	const pageModulePromise = ssrEntry.page;
	const onRequest = ssrEntry.onRequest;
	if (onRequest) {
		pipeline.setMiddlewareFunction(onRequest as MiddlewareEndpointHandler);
	}

	if (!pageModulePromise) {
		throw new Error(
			`Unable to find the module for ${pageData.component}. This is unexpected and likely a bug in Astro, please report.`
		);
	}
	const pageModule = await pageModulePromise();
	if (shouldSkipDraft(pageModule, pipeline.getSettings())) {
		logger.info(null, `${magenta('⚠️')}  Skipping draft ${pageData.route.component}`);
		// TODO: Remove in Astro 4.0
		logger.warn(
			'astro',
			`The drafts feature is deprecated. You should migrate to content collections instead. See https://docs.astro.build/en/guides/content-collections/#filtering-collection-queries for more information.`
		);
		return;
	}

	const generationOptions: Readonly<GeneratePathOptions> = {
		pageData,
		linkIds,
		scripts,
		styles,
		mod: pageModule,
	};

	const icon = pageData.route.type === 'page' ? green('▶') : magenta('λ');
	if (isRelativePath(pageData.route.component)) {
		logger.info(null, `${icon} ${pageData.route.route}`);
	} else {
		logger.info(null, `${icon} ${pageData.route.component}`);
	}

	// Get paths for the route, calling getStaticPaths if needed.
	const paths = await getPathsForRoute(
		pageData,
		pageModule,
		pipeline.getStaticBuildOptions(),
		builtPaths
	);

	let prevTimeEnd = timeStart;
	for (let i = 0; i < paths.length; i++) {
		const path = paths[i];
		await generatePath(path, generationOptions, pipeline);
		const timeEnd = performance.now();
		const timeChange = getTimeStat(prevTimeEnd, timeEnd);
		const timeIncrease = `(+${timeChange})`;
		const filePath = getOutputFilename(pipeline.getConfig(), path, pageData.route.type);
		const lineIcon = i === paths.length - 1 ? '└─' : '├─';
		logger.info(null, `  ${cyan(lineIcon)} ${dim(filePath)} ${dim(timeIncrease)}`);
		prevTimeEnd = timeEnd;
	}
}

async function getPathsForRoute(
	pageData: PageBuildData,
	mod: ComponentInstance,
	opts: StaticBuildOptions,
	builtPaths: Set<string>
): Promise<Array<string>> {
	let paths: Array<string> = [];
	if (pageData.route.pathname) {
		paths.push(pageData.route.pathname);
		builtPaths.add(pageData.route.pathname);
	} else {
		const route = pageData.route;
		const staticPaths = await callGetStaticPaths({
			mod,
			route,
			routeCache: opts.routeCache,
			logging: opts.logging,
			ssr: isServerLikeOutput(opts.settings.config),
		}).catch((err) => {
			debug('build', `├── ${colors.bold(colors.red('✗'))} ${route.component}`);
			throw err;
		});

		const label = staticPaths.length === 1 ? 'page' : 'pages';
		debug(
			'build',
			`├── ${colors.bold(colors.green('✔'))} ${route.component} → ${colors.magenta(
				`[${staticPaths.length} ${label}]`
			)}`
		);

		paths = staticPaths
			.map((staticPath) => {
				try {
					return route.generate(staticPath.params);
				} catch (e) {
					if (e instanceof TypeError) {
						throw getInvalidRouteSegmentError(e, route, staticPath);
					}
					throw e;
				}
			})
			.filter((staticPath) => {
				// The path hasn't been built yet, include it
				if (!builtPaths.has(removeTrailingForwardSlash(staticPath))) {
					return true;
				}

				// The path was already built once. Check the manifest to see if
				// this route takes priority for the final URL.
				// NOTE: The same URL may match multiple routes in the manifest.
				// Routing priority needs to be verified here for any duplicate
				// paths to ensure routing priority rules are enforced in the final build.
				const matchedRoute = matchRoute(staticPath, opts.manifest);
				return matchedRoute === route;
			});

		// Add each path to the builtPaths set, to avoid building it again later.
		for (const staticPath of paths) {
			builtPaths.add(removeTrailingForwardSlash(staticPath));
		}
	}

	return paths;
}

function getInvalidRouteSegmentError(
	e: TypeError,
	route: RouteData,
	staticPath: GetStaticPathsItem
): AstroError {
	const invalidParam = e.message.match(/^Expected "([^"]+)"/)?.[1];
	const received = invalidParam ? staticPath.params[invalidParam] : undefined;
	let hint =
		'Learn about dynamic routes at https://docs.astro.build/en/core-concepts/routing/#dynamic-routes';
	if (invalidParam && typeof received === 'string') {
		const matchingSegment = route.segments.find(
			(segment) => segment[0]?.content === invalidParam
		)?.[0];
		const mightBeMissingSpread = matchingSegment?.dynamic && !matchingSegment?.spread;
		if (mightBeMissingSpread) {
			hint = `If the param contains slashes, try using a rest parameter: **[...${invalidParam}]**. Learn more at https://docs.astro.build/en/core-concepts/routing/#dynamic-routes`;
		}
	}
	return new AstroError({
		...AstroErrorData.InvalidDynamicRoute,
		message: invalidParam
			? AstroErrorData.InvalidDynamicRoute.message(
					route.route,
					JSON.stringify(invalidParam),
					JSON.stringify(received)
			  )
			: `Generated path for ${route.route} is invalid.`,
		hint,
	});
}

interface GeneratePathOptions {
	pageData: PageBuildData;
	linkIds: string[];
	scripts: { type: 'inline' | 'external'; value: string } | null;
	styles: StylesheetAsset[];
	mod: ComponentInstance;
}

function shouldAppendForwardSlash(
	trailingSlash: AstroConfig['trailingSlash'],
	buildFormat: AstroConfig['build']['format']
): boolean {
	switch (trailingSlash) {
		case 'always':
			return true;
		case 'never':
			return false;
		case 'ignore': {
			switch (buildFormat) {
				case 'directory':
					return true;
				case 'file':
					return false;
			}
		}
	}
}

function addPageName(pathname: string, opts: StaticBuildOptions): void {
	const trailingSlash = opts.settings.config.trailingSlash;
	const buildFormat = opts.settings.config.build.format;
	const pageName = shouldAppendForwardSlash(trailingSlash, buildFormat)
		? pathname.replace(/\/?$/, '/').replace(/^\//, '')
		: pathname.replace(/^\//, '');
	opts.pageNames.push(pageName);
}

function getUrlForPath(
	pathname: string,
	base: string,
	origin: string,
	format: 'directory' | 'file',
	routeType: RouteType
): URL {
	/**
	 * Examples:
	 * pathname: /, /foo
	 * base: /
	 */
	const ending = format === 'directory' ? '/' : '.html';
	let buildPathname: string;
	if (pathname === '/' || pathname === '') {
		buildPathname = base;
	} else if (routeType === 'endpoint') {
		const buildPathRelative = removeLeadingForwardSlash(pathname);
		buildPathname = joinPaths(base, buildPathRelative);
	} else {
		const buildPathRelative =
			removeTrailingForwardSlash(removeLeadingForwardSlash(pathname)) + ending;
		buildPathname = joinPaths(base, buildPathRelative);
	}
	const url = new URL(buildPathname, origin);
	return url;
}

async function generatePath(pathname: string, gopts: GeneratePathOptions, pipeline: BuildPipeline) {
	const manifest = pipeline.getManifest();
	const { mod, scripts: hoistedScripts, styles: _styles, pageData } = gopts;

	// This adds the page name to the array so it can be shown as part of stats.
	if (pageData.route.type === 'page') {
		addPageName(pathname, pipeline.getStaticBuildOptions());
	}

	debug('build', `Generating: ${pathname}`);

	// may be used in the future for handling rel=modulepreload, rel=icon, rel=manifest etc.
	const links = new Set<never>();
	const scripts = createModuleScriptsSet(
		hoistedScripts ? [hoistedScripts] : [],
		manifest.base,
		manifest.assetsPrefix
	);
	const styles = createStylesheetElementSet(_styles, manifest.base, manifest.assetsPrefix);

	if (pipeline.getSettings().scripts.some((script) => script.stage === 'page')) {
		const hashedFilePath = pipeline.getInternals().entrySpecifierToBundleMap.get(PAGE_SCRIPT_ID);
		if (typeof hashedFilePath !== 'string') {
			throw new Error(`Cannot find the built path for ${PAGE_SCRIPT_ID}`);
		}
		const src = createAssetLink(hashedFilePath, manifest.base, manifest.assetsPrefix);
		scripts.add({
			props: { type: 'module', src },
			children: '',
		});
	}

	// Add all injected scripts to the page.
	for (const script of pipeline.getSettings().scripts) {
		if (script.stage === 'head-inline') {
			scripts.add({
				props: {},
				children: script.content,
			});
		}
	}

	const ssr = isServerLikeOutput(pipeline.getConfig());
	const url = getUrlForPath(
		pathname,
		pipeline.getConfig().base,
		pipeline.getStaticBuildOptions().origin,
		pipeline.getConfig().build.format,
		pageData.route.type
	);

	const renderContext = await createRenderContext({
		pathname,
		request: createRequest({
			url,
			headers: new Headers(),
			logging: pipeline.getStaticBuildOptions().logging,
			ssr,
		}),
		componentMetadata: manifest.componentMetadata,
		scripts,
		styles,
		links,
		route: pageData.route,
		env: pipeline.getEnvironment(),
		mod,
	});

	let body: string | Uint8Array;
	let encoding: BufferEncoding | undefined;

	let response: Response;
	try {
		response = await pipeline.renderRoute(renderContext, mod);
	} catch (err) {
		if (!AstroError.is(err) && !(err as SSRError).id && typeof err === 'object') {
			(err as SSRError).id = pageData.component;
		}
		throw err;
	}

	if (response.status >= 300 && response.status < 400) {
		// If redirects is set to false, don't output the HTML
		if (!pipeline.getConfig().build.redirects) {
			return;
		}
		const location = getRedirectLocationOrThrow(response.headers);
		const fromPath = new URL(renderContext.request.url).pathname;
		// A short delay causes Google to interpret the redirect as temporary.
		// https://developers.google.com/search/docs/crawling-indexing/301-redirects#metarefresh
		const delay = response.status === 302 ? 2 : 0;
		body = `<!doctype html>
<title>Redirecting to: ${location}</title>
<meta http-equiv="refresh" content="${delay};url=${location}">
<meta name="robots" content="noindex">
<link rel="canonical" href="${location}">
<body>
	<a href="${location}">Redirecting from <code>${fromPath}</code> to <code>${location}</code></a>
</body>`;
		// A dynamic redirect, set the location so that integrations know about it.
		if (pageData.route.type !== 'redirect') {
			pageData.route.redirect = location;
		}
	} else {
		// If there's no body, do nothing
		if (!response.body) return;
		body = Buffer.from(await response.arrayBuffer());
		encoding = (response.headers.get('X-Astro-Encoding') as BufferEncoding | null) ?? 'utf-8';
	}

	const outFolder = getOutFolder(pipeline.getConfig(), pathname, pageData.route.type);
	const outFile = getOutFile(pipeline.getConfig(), outFolder, pathname, pageData.route.type);
	pageData.route.distURL = outFile;

	await fs.promises.mkdir(outFolder, { recursive: true });
	await fs.promises.writeFile(outFile, body, encoding);
}

/**
 * It creates a `SSRManifest` from the `AstroSettings`.
 *
 * Renderers needs to be pulled out from the page module emitted during the build.
 * @param settings
 * @param renderers
 */
export function createBuildManifest(
	settings: AstroSettings,
	internals: BuildInternals,
	renderers: SSRLoadedRenderer[]
): SSRManifest {
	return {
		assets: new Set(),
		entryModules: Object.fromEntries(internals.entrySpecifierToBundleMap.entries()),
		routes: [],
		adapterName: '',
		clientDirectives: settings.clientDirectives,
		compressHTML: settings.config.compressHTML,
		renderers,
		base: settings.config.base,
		assetsPrefix: settings.config.build.assetsPrefix,
		site: settings.config.site
			? new URL(settings.config.base, settings.config.site).toString()
			: settings.config.site,
		componentMetadata: internals.componentMetadata,
	};
}
