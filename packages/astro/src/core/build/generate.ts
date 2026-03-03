import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import PLimit from 'p-limit';
import PQueue from 'p-queue';
import colors from 'piccolore';
import {
	generateImagesForPath,
	getStaticImageList,
	prepareAssetsGenerationEnv,
} from '../../assets/build/generate.js';
import {
	collapseDuplicateTrailingSlashes,
	joinPaths,
	removeLeadingForwardSlash,
	removeTrailingForwardSlash,
	trimSlashes,
} from '../../core/path.js';
import { runHookBuildGenerated, toIntegrationResolvedRoute } from '../../integrations/hooks.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { Logger } from '../logger/core.js';
import type { AstroPrerenderer, RouteToHeaders } from '../../types/public/index.js';
import type { RouteData, RouteType, SSRError } from '../../types/public/internal.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { getRedirectLocationOrThrow } from '../redirects/index.js';
import { createRequest } from '../request.js';
import { redirectTemplate } from '../routing/3xx.js';
import { routeIsRedirect } from '../routing/helpers.js';
import { matchRoute } from '../routing/match.js';
import { getOutputFilename } from '../util.js';
import { getOutFile, getOutFolder } from './common.js';
import { createDefaultPrerenderer, type DefaultPrerenderer } from './default-prerenderer.js';
import { type BuildInternals, hasPrerenderedPages } from './internal.js';
import type { StaticBuildOptions } from './types.js';
import type { AstroSettings } from '../../types/astro.js';
import { getTimeStat, shouldAppendForwardSlash } from './util.js';

export async function generatePages(
	options: StaticBuildOptions,
	internals: BuildInternals,
	prerenderOutputDir: URL,
) {
	const generatePagesTimer = performance.now();
	const ssr = options.settings.buildOutput === 'server';
	const logger = options.logger;
	const hasPagesToGenerate = hasPrerenderedPages(internals);

	// HACK! `astro:assets` relies on a global to know if its running in dev, prod, ssr, ssg, full moon
	// If we don't delete it here, it's technically not impossible (albeit improbable) for it to leak
	if (ssr && !hasPagesToGenerate) {
		delete globalThis?.astroAsset?.addStaticImage;
	}

	// Exit early when no prerendered pages were discovered to avoid setting up
	// and tearing down the prerenderer for an empty set of routes.
	if (!hasPagesToGenerate) {
		return;
	}

	// Get or create the prerenderer
	let prerenderer: DefaultPrerenderer;
	const settingsPrerenderer = options.settings.prerenderer;
	if (!settingsPrerenderer) {
		// No custom prerenderer - create default
		prerenderer = createDefaultPrerenderer({
			internals,
			options,
			prerenderOutputDir,
		});
	} else if (typeof settingsPrerenderer === 'function') {
		// Factory function - create default and pass it
		const defaultPrerenderer = createDefaultPrerenderer({
			internals,
			options,
			prerenderOutputDir,
		});
		prerenderer = settingsPrerenderer(defaultPrerenderer);
	} else {
		// Direct prerenderer object - use as-is
		prerenderer = settingsPrerenderer;
	}

	// Setup the prerenderer
	await prerenderer.setup?.();

	const verb = ssr ? 'prerendering' : 'generating';
	logger.info('SKIP_FORMAT', `\n${colors.bgGreen(colors.black(` ${verb} static routes `))}`);

	// Get all static paths with their routes from the prerenderer
	const pathsWithRoutes = await prerenderer.getStaticPaths();
	const routeToHeaders: RouteToHeaders = new Map();

	// Check if i18n domains are configured (incompatible with prerendering)
	const hasI18nDomains =
		ssr &&
		options.settings.config.i18n?.domains &&
		Object.keys(options.settings.config.i18n.domains).length > 0;

	// Filter paths for conflicts (same path from multiple routes)
	const { config } = options.settings;
	const builtPaths = new Set<string>();
	const filteredPaths = pathsWithRoutes.filter(({ pathname, route }) => {
		// i18n domains won't work with prerendered routes
		if (hasI18nDomains && route.prerender) {
			throw new AstroError({
				...AstroErrorData.NoPrerenderedRoutesWithDomains,
				message: AstroErrorData.NoPrerenderedRoutesWithDomains.message(route.component),
			});
		}

		const normalized = removeTrailingForwardSlash(pathname);

		// Path hasn't been built yet, include it
		if (!builtPaths.has(normalized)) {
			builtPaths.add(normalized);
			return true;
		}

		// Path was already built. Check if this route has higher priority.
		const matchedRoute = matchRoute(decodeURI(pathname), options.routesList);
		if (!matchedRoute) {
			return false;
		}

		if (matchedRoute === route) {
			// Current route is higher-priority. Include it for building.
			return true;
		}

		// Current route is lower-priority. Warn or error based on config.
		if (config.prerenderConflictBehavior === 'error') {
			throw new AstroError({
				...AstroErrorData.PrerenderRouteConflict,
				message: AstroErrorData.PrerenderRouteConflict.message(
					matchedRoute.route,
					route.route,
					normalized,
				),
				hint: AstroErrorData.PrerenderRouteConflict.hint(matchedRoute.route, route.route),
			});
		} else if (config.prerenderConflictBehavior === 'warn') {
			const msg = AstroErrorData.PrerenderRouteConflict.message(
				matchedRoute.route,
				route.route,
				normalized,
			);
			logger.warn('build', msg);
		}

		return false;
	});

	// Generate each path
	if (config.build.concurrency > 1) {
		const limit = PLimit(config.build.concurrency);
		// Process in batches to avoid V8's Promise.all element limit, which is around ~123k items
		//
		// NOTE: ideally we could consider an iterator to avoid the batching limitation
		const BATCH_SIZE = 100_000;
		for (let i = 0; i < filteredPaths.length; i += BATCH_SIZE) {
			const batch = filteredPaths.slice(i, i + BATCH_SIZE);
			const promises: Promise<void>[] = [];
			for (const { pathname, route } of batch) {
				promises.push(
					limit(() =>
						generatePathWithPrerenderer(
							prerenderer,
							pathname,
							route,
							options,
							routeToHeaders,
							logger,
						),
					),
				);
			}
			await Promise.all(promises);
		}
	} else {
		for (const { pathname, route } of filteredPaths) {
			await generatePathWithPrerenderer(
				prerenderer,
				pathname,
				route,
				options,
				routeToHeaders,
				logger,
			);
		}
	}

	const staticImageList = getStaticImageList();

	// Must happen before teardown since collectStaticImages fetches from the prerender server
	if (prerenderer.collectStaticImages) {
		const adapterImages = await prerenderer.collectStaticImages();
		for (const [path, entry] of adapterImages) {
			staticImageList.set(path, entry);
		}
	}

	// Teardown the prerenderer
	await prerenderer.teardown?.();
	logger.info(
		null,
		colors.green(`✓ Completed in ${getTimeStat(generatePagesTimer, performance.now())}.\n`),
	);

	// Log pool statistics if queue rendering is enabled
	if (
		options.settings.logLevel === 'debug' &&
		options.settings.config.experimental?.queuedRendering &&
		prerenderer.app
	) {
		try {
			const stats = prerenderer.app.getQueueStats();
			// Dynamic import to avoid loading pool module when not using queue rendering
			// Only log if there was actual pool activity
			if (stats && (stats.acquireFromPool > 0 || stats.acquireNew > 0)) {
				logger.info(
					null,
					colors.dim(
						`[Queue Pool] ${stats.acquireFromPool.toLocaleString()} reused / ${stats.acquireNew.toLocaleString()} new nodes | ` +
							`Hit rate: ${stats.hitRate.toFixed(1)}% | ` +
							`Pool: ${stats.poolSize}/${stats.maxSize}`,
					),
				);
			}
		} catch {
			// Silently ignore if pool module is not available
		}
	}

	// Default pipeline always runs
	if (staticImageList.size) {
		logger.info('SKIP_FORMAT', `${colors.bgGreen(colors.black(` generating optimized images `))}`);

		const totalCount = Array.from(staticImageList.values())
			.map((x) => x.transforms.size)
			.reduce((a, b) => a + b, 0);
		const cpuCount = os.cpus().length;
		const assetsCreationPipeline = await prepareAssetsGenerationEnv(options, totalCount);
		const queue = new PQueue({ concurrency: Math.max(cpuCount, 1) });

		const assetsTimer = performance.now();
		for (const [originalPath, transforms] of staticImageList) {
			// Process each source image in parallel based on the queue’s concurrency
			// (`cpuCount`). Process each transform for a source image sequentially.
			//
			// # Design Decision:
			// We have 3 source images (A.png, B.png, C.png) and 3 transforms for
			// each:
			// ```
			// A1.png A2.png A3.png
			// B1.png B2.png B3.png
			// C1.png C2.png C3.png
			// ```
			//
			// ## Option 1
			// Enqueue all transforms indiscriminantly
			// ```
			// |_A1.png   |_B2.png   |_C1.png
			// |_B3.png   |_A2.png   |_C3.png
			// |_C2.png   |_A3.png   |_B1.png
			// ```
			// * Advantage: Maximum parallelism, saturate CPU
			// * Disadvantage: Spike in context switching
			//
			// ## Option 2
			// Enqueue all transforms, but constrain processing order by source image
			// ```
			// |_A3.png   |_B1.png   |_C2.png
			// |_A1.png   |_B3.png   |_C1.png
			// |_A2.png   |_B2.png   |_C3.png
			// ```
			// * Advantage: Maximum parallelism, saturate CPU (same as Option 1) in
			//   hope to avoid context switching
			// * Disadvantage: Context switching still occurs and performance still
			//   suffers
			//
			// ## Option 3
			// Enqueue each source image, but perform the transforms for that source
			// image sequentially
			// ```
			// \_A1.png   \_B1.png   \_C1.png
			//  \_A2.png   \_B2.png   \_C2.png
			//   \_A3.png   \_B3.png   \_C3.png
			// ```
			// * Advantage: Less context switching
			// * Disadvantage: If you have a low number of source images with high
			//   number of transforms then this is suboptimal.
			//
			// ## BEST OPTION:
			// **Option 3**. Most projects will have a higher number of source images
			// with a few transforms on each. Even though Option 2 should be faster
			// and _should_ prevent context switching, this was not observed in
			// nascent tests. Context switching was high and the overall performance
			// was half of Option 3.
			//
			// If looking to optimize further, please consider the following:
			// * Avoid `queue.add()` in an async for loop. Notice the `await
			//   queue.onIdle();` after this loop. We do not want to create a scenario
			//   where tasks are added to the queue after the queue.onIdle() resolves.
			//   This can break tests and create annoying race conditions.
			// * Exposing a concurrency property in `astro.config.mjs` to allow users
			//   to override Node’s os.cpus().length default.
			// * Create a proper performance benchmark for asset transformations of
			//   projects in varying sizes of source images and transforms.
			queue
				.add(() => generateImagesForPath(originalPath, transforms, assetsCreationPipeline))
				.catch((e) => {
					throw e;
				});
		}

		await queue.onIdle();
		const assetsTimeEnd = performance.now();
		logger.info(null, colors.green(`✓ Completed in ${getTimeStat(assetsTimer, assetsTimeEnd)}.\n`));

		delete globalThis?.astroAsset?.addStaticImage;
	}

	await runHookBuildGenerated({
		settings: options.settings,
		logger,
		routeToHeaders,
	});
}

const THRESHOLD_SLOW_RENDER_TIME_MS = 500;

/**
 * Generate a single path using the prerenderer interface.
 */
async function generatePathWithPrerenderer(
	prerenderer: AstroPrerenderer,
	pathname: string,
	route: RouteData,
	options: StaticBuildOptions,
	routeToHeaders: RouteToHeaders,
	logger: Logger,
): Promise<void> {
	const timeStart = performance.now();
	const { config } = options.settings;

	const filePath = getOutputFilename(config.build.format, pathname, route);
	logger.info(null, `  ${colors.blue('├─')} ${colors.dim(filePath)}`, false);

	// Track page name for stats
	if (route.type === 'page') {
		addPageName(pathname, options);
	}

	// Do not render the fallback route if there is already a translated page
	// with the same path
	if (route.type === 'fallback' && route.pathname !== '/') {
		if (
			options.routesList.routes.some((routeData) => {
				if (routeData.pattern.test(pathname)) {
					// Check if we've matched a dynamic route
					if (routeData.params && routeData.params.length !== 0) {
						// Make sure the pathname matches an entry in distURL
						if (
							routeData.distURL &&
							!routeData.distURL.find(
								(url) =>
									url.href
										.replace(config.outDir.toString(), '')
										.replace(/(?:\/index\.html|\.html)$/, '') === trimSlashes(pathname),
							)
						) {
							return false;
						}
					}
					// Route matches
					return true;
				} else {
					return false;
				}
			})
		) {
			return;
		}
	}

	// Build the request URL
	const url = getUrlForPath(
		pathname,
		config.base,
		options.origin,
		config.build.format,
		config.trailingSlash,
		route.type,
	);

	const request = createRequest({
		url,
		headers: new Headers(),
		logger,
		isPrerendered: true,
		routePattern: route.component,
	});

	// Render using the prerenderer
	let response: Response;
	try {
		response = await prerenderer.render(request, { routeData: route });
	} catch (err) {
		logger.error('build', `Caught error rendering ${pathname}: ${err}`);
		if (err && !AstroError.is(err) && !(err as SSRError).id && typeof err === 'object') {
			(err as SSRError).id = route.component;
		}
		throw err;
	}

	// Handle the response
	let body: string | Uint8Array;
	const responseHeaders = response.headers;

	if (response.status >= 300 && response.status < 400) {
		// Handle redirects
		if (routeIsRedirect(route) && !config.build.redirects) {
			logRenderTime(logger, timeStart, false);
			return;
		}
		const locationSite = getRedirectLocationOrThrow(responseHeaders);
		const siteURL = config.site;
		const location = siteURL ? new URL(locationSite, siteURL) : locationSite;
		const fromPath = new URL(request.url).pathname;
		body = redirectTemplate({
			status: response.status,
			absoluteLocation: location,
			relativeLocation: locationSite,
			from: fromPath,
		});
		if (config.compressHTML === true) {
			body = body.replaceAll('\n', '');
		}
		if (route.type !== 'redirect') {
			route.redirect = location.toString();
		}
	} else {
		if (!response.body) {
			logRenderTime(logger, timeStart, true);
			return;
		}
		body = Buffer.from(await response.arrayBuffer());
	}

	// Write the file
	const encodedPath = encodeURI(pathname);
	const outFolder = getOutFolder(options.settings, encodedPath, route);
	const outFile = getOutFile(config.build.format, outFolder, encodedPath, route);
	if (route.distURL) {
		route.distURL.push(outFile);
	} else {
		route.distURL = [outFile];
	}

	// Track headers for static headers feature
	const integrationRoute = toIntegrationResolvedRoute(route, config.trailingSlash);
	if (options.settings.adapter?.adapterFeatures?.staticHeaders) {
		routeToHeaders.set(pathname, { headers: responseHeaders, route: integrationRoute });
	}

	// Public files take priority over generated routes
	if (checkPublicConflict(outFile, route, options.settings, logger)) return;

	await fs.promises.mkdir(outFolder, { recursive: true });
	await fs.promises.writeFile(outFile, body);

	logRenderTime(logger, timeStart, false);
}

function logRenderTime(logger: Logger, timeStart: number, notCreated: boolean) {
	const timeEnd = performance.now();
	const isSlow = timeEnd - timeStart > THRESHOLD_SLOW_RENDER_TIME_MS;
	const timeIncrease = (isSlow ? colors.red : colors.dim)(`(+${getTimeStat(timeStart, timeEnd)})`);
	const notCreatedMsg = notCreated
		? colors.yellow('(file not created, response body was empty)')
		: '';
	logger.info('SKIP_FORMAT', ` ${timeIncrease} ${notCreatedMsg}`);
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
	routeType: RouteType,
): URL {
	/**
	 * Examples:
	 * pathname: /, /foo
	 * base: /
	 */

	let ending: string;
	switch (format) {
		case 'directory':
		case 'preserve': {
			ending = trailingSlash === 'never' ? '' : '/';
			break;
		}
		case 'file':
		default: {
			ending = '.html';
			break;
		}
	}
	let buildPathname: string;
	if (pathname === '/' || pathname === '') {
		buildPathname = collapseDuplicateTrailingSlashes(base + ending, trailingSlash !== 'never');
	} else if (routeType === 'endpoint') {
		const buildPathRelative = removeLeadingForwardSlash(pathname);
		buildPathname = joinPaths(base, buildPathRelative);
	} else {
		const buildPathRelative =
			removeTrailingForwardSlash(removeLeadingForwardSlash(pathname)) + ending;
		buildPathname = joinPaths(base, buildPathRelative);
	}
	return new URL(buildPathname, origin);
}

/**
 * Check if a file exists in the public directory that would conflict with the output file.
 * Public files take priority over generated routes. Returns true if there's a conflict.
 */
function checkPublicConflict(
	outFile: URL,
	route: RouteData,
	settings: AstroSettings,
	logger: Logger,
): boolean {
	const outFilePath = fileURLToPath(outFile);
	const outRoot = fileURLToPath(
		settings.buildOutput === 'static' ? settings.config.outDir : settings.config.build.client,
	);
	const relativePath = outFilePath.slice(outRoot.length);
	const publicFilePath = new URL(relativePath, settings.config.publicDir);
	if (fs.existsSync(publicFilePath)) {
		logger.warn(
			'build',
			`Skipping ${route.component} because a file with the same name exists in the public folder: ${relativePath}`,
		);
		return true;
	}
	return false;
}
