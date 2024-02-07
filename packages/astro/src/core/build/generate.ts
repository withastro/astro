import { bgGreen, black, blue, bold, dim, green, magenta, red } from 'kleur/colors';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import PQueue from 'p-queue';
import type { OutputAsset, OutputChunk } from 'rollup';
import type {
	AstroConfig,
	AstroSettings,
	ComponentInstance,
	GetStaticPathsItem,
	MiddlewareHandler,
	RouteData,
	RouteType,
	SSRError,
	SSRLoadedRenderer,
	SSRManifest,
} from '../../@types/astro.js';
import {
	generateImagesForPath,
	getStaticImageList,
	prepareAssetsGenerationEnv,
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
import type { SSRManifestI18n } from '../app/types.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { routeIsFallback } from '../redirects/helpers.js';
import {
	RedirectSinglePageBuiltModule,
	getRedirectLocationOrThrow,
	routeIsRedirect,
} from '../redirects/index.js';
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
import { BuildEnvironment } from './environment.js';
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
} from './types.js';
import { getTimeStat, shouldAppendForwardSlash } from './util.js';
import { NoPrerenderedRoutesWithDomains } from '../errors/errors-data.js';
import { Pipeline } from '../pipeline.js';

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

async function getEntryForFallbackRoute(
	route: RouteData,
	internals: BuildInternals,
	outFolder: URL
): Promise<SinglePageBuiltModule> {
	if (route.type !== 'fallback') {
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

export async function generatePages(options: StaticBuildOptions, internals: BuildInternals) {
	const generatePagesTimer = performance.now();
	const ssr = isServerLikeOutput(options.settings.config);
	let manifest: SSRManifest;
	if (ssr) {
		manifest = await BuildEnvironment.retrieveManifest(options, internals);
	} else {
		const baseDirectory = getOutputDirectory(options.settings.config);
		const renderersEntryUrl = new URL('renderers.mjs', baseDirectory);
		const renderers = await import(renderersEntryUrl.toString());
		let middleware: MiddlewareHandler = (_, next) => next();
		try {
			// middleware.mjs is not emitted if there is no user middleware
			// in which case the import fails with ERR_MODULE_NOT_FOUND, and we fall back to a no-op middleware
			middleware = await import(new URL('middleware.mjs', baseDirectory).toString()).then(
				(mod) => mod.onRequest
			);
		} catch {}
		manifest = createBuildManifest(
			options.settings,
			internals,
			renderers.renderers as SSRLoadedRenderer[],
			middleware
		);
	}
	const environment = BuildEnvironment.create({ internals, manifest, options });
	const { config, logger } = environment;

	const outFolder = ssr
		? options.settings.config.build.server
		: getOutDirWithinCwd(options.settings.config.outDir);

	// HACK! `astro:assets` relies on a global to know if its running in dev, prod, ssr, ssg, full moon
	// If we don't delete it here, it's technically not impossible (albeit improbable) for it to leak
	if (ssr && !hasPrerenderedPages(internals)) {
		delete globalThis?.astroAsset?.addStaticImage;
		return;
	}

	const verb = ssr ? 'prerendering' : 'generating';
	logger.info('SKIP_FORMAT', `\n${bgGreen(black(` ${verb} static routes `))}`);
	const builtPaths = new Set<string>();
	const pagesToGenerate = environment.retrieveRoutesToGenerate();
	if (ssr) {
		for (const [pageData, filePath] of pagesToGenerate) {
			if (pageData.route.prerender) {
				// i18n domains won't work with pre rendered routes at the moment, so we need to to throw an error
				if (config.experimental.i18nDomains) {
					throw new AstroError({
						...NoPrerenderedRoutesWithDomains,
						message: NoPrerenderedRoutesWithDomains.message(pageData.component),
					});
				}

				const ssrEntryURLPage = createEntryURL(filePath, outFolder);
				const ssrEntryPage = await import(ssrEntryURLPage.toString());
				if (options.settings.adapter?.adapterFeatures?.functionPerRoute) {
					// forcing to use undefined, so we fail in an expected way if the module is not even there.
					const ssrEntry = ssrEntryPage?.pageModule;
					if (ssrEntry) {
						await generatePage(pageData, ssrEntry, builtPaths, environment);
					} else {
						throw new Error(
							`Unable to find the manifest for the module ${ssrEntryURLPage.toString()}. This is unexpected and likely a bug in Astro, please report.`
						);
					}
				} else {
					const ssrEntry = ssrEntryPage as SinglePageBuiltModule;
					await generatePage(pageData, ssrEntry, builtPaths, environment);
				}
			}
		}
	} else {
		for (const [pageData, filePath] of pagesToGenerate) {
			if (routeIsRedirect(pageData.route)) {
				const entry = await getEntryForRedirectRoute(pageData.route, internals, outFolder);
				await generatePage(pageData, entry, builtPaths, environment);
			} else if (routeIsFallback(pageData.route)) {
				const entry = await getEntryForFallbackRoute(pageData.route, internals, outFolder);
				await generatePage(pageData, entry, builtPaths, environment);
			} else {
				const ssrEntryURLPage = createEntryURL(filePath, outFolder);
				const entry: SinglePageBuiltModule = await import(ssrEntryURLPage.toString());

				await generatePage(pageData, entry, builtPaths, environment);
			}
		}
	}
	logger.info(
		null,
		green(`✓ Completed in ${getTimeStat(generatePagesTimer, performance.now())}.\n`)
	);

	const staticImageList = getStaticImageList();
	if (staticImageList.size) {
		logger.info('SKIP_FORMAT', `${bgGreen(black(` generating optimized images `))}`);

		const totalCount = Array.from(staticImageList.values())
			.map((x) => x.transforms.size)
			.reduce((a, b) => a + b, 0);
		const cpuCount = os.cpus().length;
		const assetsCreationEnvironment = await prepareAssetsGenerationEnv(environment, totalCount);
		const queue = new PQueue({ concurrency: Math.max(cpuCount, 1) });

		const assetsTimer = performance.now();
		for (const [originalPath, transforms] of staticImageList) {
			await generateImagesForPath(originalPath, transforms, assetsCreationEnvironment, queue);
		}

		await queue.onIdle();
		const assetsTimeEnd = performance.now();
		logger.info(null, green(`✓ Completed in ${getTimeStat(assetsTimer, assetsTimeEnd)}.\n`));

		delete globalThis?.astroAsset?.addStaticImage;
	}

	await runHookBuildGenerated({ config, logger });
}

async function generatePage(
	pageData: PageBuildData,
	ssrEntry: SinglePageBuiltModule,
	builtPaths: Set<string>,
	environment: BuildEnvironment
) {
	// prepare information we need
	const { config, internals, logger, manifest } = environment;
	const pageModulePromise = ssrEntry.page;
	const onRequest = manifest.middleware;
	const pageInfo = getPageDataByComponent(internals, pageData.route.component);

	// Calculate information of the page, like scripts, links and styles
	const styles = pageData.styles
		.sort(cssOrder)
		.map(({ sheet }) => sheet)
		.reduce(mergeInlineCss, []);
	// may be used in the future for handling rel=modulepreload, rel=icon, rel=manifest etc.
	const linkIds: [] = [];
	const scripts = pageInfo?.hoistedScript ?? null;
	if (!pageModulePromise) {
		throw new Error(
			`Unable to find the module for ${pageData.component}. This is unexpected and likely a bug in Astro, please report.`
		);
	}
	const pageModule = await pageModulePromise();
	const generationOptions: Readonly<GeneratePathOptions> = {
		pageData,
		linkIds,
		scripts,
		styles,
		mod: pageModule,
	};
	// Now we explode the routes. A route render itself, and it can render its fallbacks (i18n routing)
	for (const route of eachRouteInRouteData(pageData)) {
		const icon =
			route.type === 'page' || route.type === 'redirect' || route.type === 'fallback'
				? green('▶')
				: magenta('λ');
		logger.info(null, `${icon} ${getPrettyRouteName(route)}`);
		// Get paths for the route, calling getStaticPaths if needed.
		const paths = await getPathsForRoute(route, pageModule, environment, builtPaths);
		let timeStart = performance.now();
		let prevTimeEnd = timeStart;
		for (let i = 0; i < paths.length; i++) {
			const path = paths[i];
			environment.logger.debug('build', `Generating: ${path}`);
			const filePath = getOutputFilename(config, path, pageData.route.type);
			const lineIcon = i === paths.length - 1 ? '└─' : '├─';
			logger.info(null, `  ${blue(lineIcon)} ${dim(filePath)}`, false);
			await generatePath(path, environment, generationOptions, route);
			const timeEnd = performance.now();
			const timeChange = getTimeStat(prevTimeEnd, timeEnd);
			const timeIncrease = `(+${timeChange})`;
			logger.info('SKIP_FORMAT', ` ${dim(timeIncrease)}`);
			prevTimeEnd = timeEnd;
		}
	}
}

function* eachRouteInRouteData(data: PageBuildData) {
	yield data.route;
	for (const fallbackRoute of data.route.fallbackRoutes) {
		yield fallbackRoute;
	}
}

async function getPathsForRoute(
	route: RouteData,
	mod: ComponentInstance,
	environment: BuildEnvironment,
	builtPaths: Set<string>
): Promise<Array<string>> {
	const { logger, options, routeCache, serverLike } = environment;
	let paths: Array<string> = [];
	if (route.pathname) {
		paths.push(route.pathname);
		builtPaths.add(route.pathname);
		for (const virtualRoute of route.fallbackRoutes) {
			if (virtualRoute.pathname) {
				paths.push(virtualRoute.pathname);
				builtPaths.add(virtualRoute.pathname);
			}
		}
	} else {
		const staticPaths = await callGetStaticPaths({
			mod,
			route,
			routeCache,
			logger,
			ssr: serverLike,
		}).catch((err) => {
			logger.debug('build', `├── ${bold(red('✗'))} ${route.component}`);
			throw err;
		});

		const label = staticPaths.length === 1 ? 'page' : 'pages';
		logger.debug(
			'build',
			`├── ${bold(green('✔'))} ${route.component} → ${magenta(`[${staticPaths.length} ${label}]`)}`
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
				const matchedRoute = matchRoute(staticPath, options.manifest);
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
	format: AstroConfig['build']['format'],
	trailingSlash: AstroConfig['trailingSlash'],
	routeType: RouteType
): URL {
	/**
	 * Examples:
	 * pathname: /, /foo
	 * base: /
	 */
	const ending = format === 'directory' ? (trailingSlash === 'never' ? '' : '/') : '.html';
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

interface GeneratePathOptions {
	pageData: PageBuildData;
	linkIds: string[];
	scripts: { type: 'inline' | 'external'; value: string } | null;
	styles: StylesheetAsset[];
	mod: ComponentInstance;
}
async function generatePath(
	pathname: string,
	environment: BuildEnvironment,
	gopts: GeneratePathOptions,
	route: RouteData
) {
	const { mod, scripts: hoistedScripts, styles: _styles } = gopts;
	const { config, internals, logger, manifest, options, serverLike, settings } = environment;
	logger.debug('build', `Generating: ${pathname}`);

	const links = new Set<never>();
	const scripts = createModuleScriptsSet(
		hoistedScripts ? [hoistedScripts] : [],
		manifest.base,
		manifest.assetsPrefix
	);
	const styles = createStylesheetElementSet(_styles, manifest.base, manifest.assetsPrefix);

	if (settings.scripts.some((script) => script.stage === 'page')) {
		const hashedFilePath = internals.entrySpecifierToBundleMap.get(PAGE_SCRIPT_ID);
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
	for (const script of settings.scripts) {
		if (script.stage === 'head-inline') {
			scripts.add({
				props: {},
				children: script.content,
			});
		}
	}

	// This adds the page name to the array so it can be shown as part of stats.
	if (route.type === 'page') {
		addPageName(pathname, options);
	}

	const url = getUrlForPath(
		pathname,
		config.base,
		options.origin,
		config.build.format,
		config.trailingSlash,
		route.type
	);

	const request = createRequest({
		url,
		headers: new Headers(),
		logger,
		ssr: serverLike,
	});
	const { i18n } = config;

	const renderContext = await createRenderContext({
		pathname,
		request,
		componentMetadata: manifest.componentMetadata,
		scripts,
		styles,
		links,
		route,
		env: environment,
		mod,
		locales: i18n?.locales,
		routing: i18n?.routing,
		defaultLocale: i18n?.defaultLocale,
	});
	const pipeline = Pipeline.create({ environment, pathname, renderContext })

	let body: string | Uint8Array;

	let response: Response;
	try {
		response = await pipeline.renderRoute(mod);
	} catch (err) {
		if (!AstroError.is(err) && !(err as SSRError).id && typeof err === 'object') {
			(err as SSRError).id = route.component;
		}
		throw err;
	}

	if (response.status >= 300 && response.status < 400) {
		// If redirects is set to false, don't output the HTML
		if (!config.build.redirects) {
			return;
		}
		const locationSite = getRedirectLocationOrThrow(response.headers);
		const siteURL = config.site;
		const location = siteURL ? new URL(locationSite, siteURL) : locationSite;
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
		if (config.compressHTML === true) {
			body = body.replaceAll('\n', '');
		}
		// A dynamic redirect, set the location so that integrations know about it.
		if (route.type !== 'redirect') {
			route.redirect = location.toString();
		}
	} else {
		// If there's no body, do nothing
		if (!response.body) return;
		body = Buffer.from(await response.arrayBuffer());
	}

	const outFolder = getOutFolder(config, pathname, route);
	const outFile = getOutFile(config, outFolder, pathname, route);
	route.distURL = outFile;

	await fs.promises.mkdir(outFolder, { recursive: true });
	await fs.promises.writeFile(outFile, body);
}

function getPrettyRouteName(route: RouteData): string {
	if (isRelativePath(route.component)) {
		return route.route;
	} else if (route.component.includes('node_modules/')) {
		// For routes from node_modules (usually injected by integrations),
		// prettify it by only grabbing the part after the last `node_modules/`
		return route.component.match(/.*node_modules\/(.+)/)?.[1] ?? route.component;
	} else {
		return route.component;
	}
}

/**
 * It creates a `SSRManifest` from the `AstroSettings`.
 *
 * Renderers needs to be pulled out from the page module emitted during the build.
 * @param settings
 * @param renderers
 */
function createBuildManifest(
	settings: AstroSettings,
	internals: BuildInternals,
	renderers: SSRLoadedRenderer[],
	middleware: MiddlewareHandler
): SSRManifest {
	let i18nManifest: SSRManifestI18n | undefined = undefined;
	if (settings.config.i18n) {
		i18nManifest = {
			fallback: settings.config.i18n.fallback,
			routing: settings.config.i18n.routing,
			defaultLocale: settings.config.i18n.defaultLocale,
			locales: settings.config.i18n.locales,
			domainLookupTable: {},
		};
	}
	return {
		trailingSlash: settings.config.trailingSlash,
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
		i18n: i18nManifest,
		buildFormat: settings.config.build.format,
		middleware,
	};
}
