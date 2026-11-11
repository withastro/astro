import nodeFs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pLimit from 'p-limit';
import colors from 'piccolore';
import type { RouterConfig } from '../../../config.js';
import type { RoutesList } from '../../../routing.js';
import type { InjectedRoute, RouteData, RoutePart, RouteTransform } from '../../../types.js';
import {
	InvalidRedirectDestination,
	UnsupportedExternalRedirect,
} from '@astrojs/runtime/_internal/core/errors/errors-data.js';
import { AstroError } from '@astrojs/runtime/_internal/core/errors/index.js';
import type { AstroLogger } from '../logger/core.js';
import { hasFileExtension, removeLeadingForwardSlash, slash } from '@astrojs/internal-helpers/path';
import { injectServerIslandRoute } from '../server-islands/endpoint.js';
import { ensure404Route } from './astro-designed-error-pages.js';
import { routeComparator } from './priority.js';
import { getPattern } from './pattern.js';
import { parseRoute } from './parse-route.js';
import { getRoutePrerenderOption } from './prerender.js';
import { validateSegment } from './segment.js';

const require = createRequire(import.meta.url);

interface Item {
	basename: string;
	ext: string;
	parts: RoutePart[];
	file: string;
	isDir: boolean;
	isIndex: boolean;
	isPage: boolean;
	routeSuffix: string;
}

const ROUTE_DYNAMIC_SPLIT = /\[([^[\]()]+(?:\([^)]+\))?)\]/;
const ROUTE_SPREAD = /^\.{3}.+$/;

export interface RouteEntry {
	path: string;
	isDir: boolean;
}

function getParts(part: string, file: string) {
	const result: RoutePart[] = [];
	part.split(ROUTE_DYNAMIC_SPLIT).map((str, i) => {
		if (!str) return;
		const dynamic = i % 2 === 1;

		const [, content] = dynamic ? /([^(]+)$/.exec(str) || [null, null] : [null, str];

		if (!content || (dynamic && !/^(?:\.\.\.)?[\w$]+$/.test(content))) {
			throw new Error(`Invalid route ${file} — parameter name must match /^[a-zA-Z0-9_$]+$/`);
		}

		result.push({
			content,
			dynamic,
			spread: dynamic && ROUTE_SPREAD.test(content),
		});
	});

	return result;
}
/**
 * Checks whether two route segments are semantically equivalent.
 *
 * Two segments are equivalent if they would match the same paths. This happens when:
 * - They have the same length.
 * - Each part in the same position is either:
 *   - Both static and with the same content (e.g. `/foo` and `/foo`).
 *   - Both dynamic, regardless of the content (e.g. `/[bar]` and `/[baz]`).
 *   - Both rest parameters, regardless of the content (e.g. `/[...bar]` and `/[...baz]`).
 */
function isSemanticallyEqualSegment(segmentA: RoutePart[], segmentB: RoutePart[]) {
	if (segmentA.length !== segmentB.length) {
		return false;
	}

	for (const [index, partA] of segmentA.entries()) {
		// Safe to use the index of one segment for the other because the segments have the same length
		const partB = segmentB[index];

		if (partA.dynamic !== partB.dynamic || partA.spread !== partB.spread) {
			return false;
		}

		// Only compare the content on non-dynamic segments
		// `/[bar]` and `/[baz]` are effectively the same route,
		// only bound to a different path parameter.
		if (!partA.dynamic && partA.content !== partB.content) {
			return false;
		}
	}

	return true;
}

type RoutingConfig = Pick<
	RouterConfig,
	'root' | 'srcDir' | 'base' | 'trailingSlash' | 'output' | 'pageExtensions'
>;

/** An injected route, with the origin it is reported with (`'external'` by default). */
export type OriginInjectedRoute = InjectedRoute & { origin?: RouteData['origin'] };

export interface CreateRoutesListParams {
	config: RouterConfig;
	/** Routes added besides the files in `src/pages/`, in order. */
	injectedRoutes?: readonly OriginInjectedRoute[];
	/**
	 * Routes registered with `api.astroRouter.injectRoute(route, { internal: true })`. They skip
	 * prerender detection and are added ahead of the sorted routes, in dev and in server builds.
	 */
	internalRoutes?: readonly InjectedRoute[];
	/**
	 * Transforms registered with `api.astroRouter.transformRoutes()`, run in order once the
	 * project's routes are collected and before the internal routes are added.
	 */
	routeTransforms?: readonly RouteTransform[];
	/** Extensions registered with `api.astroRouter.addPageExtension()`, besides `config.pageExtensions`. */
	pageExtensions?: readonly string[];
	/**
	 * Runs for each page, endpoint and redirect after its `prerender` export is read; it can change
	 * `route.prerender`.
	 */
	onRouteSetup?: (route: RouteData) => void | Promise<void>;
	/** Whether the server islands endpoint is added in a build. It is always added in dev. */
	serverIslands?: boolean;
	/** Current working directory */
	cwd?: string;
	/** fs module, for testing */
	fsMod?: typeof nodeFs;
}

/** The route table, and whether the build needs a server because a route renders on demand. */
export interface CreatedRoutesList extends RoutesList {
	buildOutput: 'static' | 'server';
}

function getPrerenderDefault(config: Pick<RouterConfig, 'output'>) {
	return config.output !== 'server';
}

function createFileBasedRoutes(
	{ config, cwd, fsMod, injectedRoutes = [] }: CreateRoutesListParams,
	logger: AstroLogger,
): RouteData[] {
	const pages = new URL('./pages', config.srcDir);
	const localFs = fsMod ?? nodeFs;
	const rootPath = fileURLToPath(config.root);
	const pagesPath = fileURLToPath(pages);

	if (!localFs.existsSync(pages)) {
		if (injectedRoutes.length === 0) {
			const pagesDirRootRelative = pages.href.slice(config.root.href.length);
			logger.warn(null, `Missing pages directory: ${pagesDirRootRelative}`);
		}
		return [];
	}

	const routes: RouteData[] = [];
	const validPageExtensions = new Set<string>(['.astro', ...config.pageExtensions]);
	const invalidPotentialPages = new Set<string>(['.tsx', '.jsx', '.vue', '.svelte']);
	const validEndpointExtensions = new Set<string>(['.js', '.ts']);
	const prerender = getPrerenderDefault(config);

	function walk(
		fs: typeof nodeFs,
		dir: string,
		parentSegments: RoutePart[][],
		parentParams: string[],
	) {
		const items: Item[] = [];
		const files = fs.readdirSync(dir);
		for (const basename of files) {
			const resolved = path.join(dir, basename);
			const file = slash(path.relative(cwd || rootPath, resolved));
			const isDir = fs.statSync(resolved).isDirectory();

			const ext = path.extname(basename);
			const name = ext ? basename.slice(0, -ext.length) : basename;
			if (name[0] === '_') {
				continue;
			}
			if (basename[0] === '.' && basename !== '.well-known') {
				continue;
			}
			if (!isDir && !validPageExtensions.has(ext) && !validEndpointExtensions.has(ext)) {
				if (invalidPotentialPages.has(ext)) {
					logger.warn(
						null,
						`Unsupported file type ${colors.bold(
							resolved,
						)} found in pages directory. Only Astro files can be used as pages. Prefix filename with an underscore (\`_\`) to ignore this warning, or move the file outside of the pages directory.`,
					);
				}

				continue;
			}
			const segment = isDir ? basename : name;
			validateSegment(segment, file);

			const parts = getParts(segment, file);
			const isIndex = isDir ? false : basename.substring(0, basename.lastIndexOf('.')) === 'index';
			const routeSuffix = basename.slice(basename.indexOf('.'), -ext.length);
			const isPage = validPageExtensions.has(ext);

			items.push({
				basename,
				ext,
				parts,
				file: file.replace(/\\/g, '/'),
				isDir,
				isIndex,
				isPage,
				routeSuffix,
			});
		}

		for (const item of items) {
			const segments = parentSegments.slice();

			if (item.isIndex) {
				if (item.routeSuffix) {
					if (segments.length > 0) {
						const lastSegment = segments[segments.length - 1].slice();
						const lastPart = lastSegment[lastSegment.length - 1];

						if (lastPart.dynamic) {
							lastSegment.push({
								dynamic: false,
								spread: false,
								content: item.routeSuffix,
							});
						} else {
							lastSegment[lastSegment.length - 1] = {
								dynamic: false,
								spread: false,
								content: `${lastPart.content}${item.routeSuffix}`,
							};
						}

						segments[segments.length - 1] = lastSegment;
					} else {
						segments.push(item.parts);
					}
				}
			} else {
				segments.push(item.parts);
			}

			const params = parentParams.slice();
			params.push(...item.parts.filter((p) => p.dynamic).map((p) => p.content));

			if (item.isDir) {
				walk(fsMod ?? fs, path.join(dir, item.basename), segments, params);
			} else {
				const component = item.file;
				const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
					? `/${segments.map((segment) => segment[0].content).join('/')}`
					: null;
				const route = joinSegments(segments);
				const trailingSlash = trailingSlashForPath(
					pathname,
					config,
					item.isPage ? 'page' : 'endpoint',
					route,
				);
				const pattern = getPattern(segments, config.base, trailingSlash);
				routes.push({
					route,
					isIndex: item.isIndex,
					type: item.isPage ? 'page' : 'endpoint',
					pattern,
					segments,
					params,
					component,
					pathname: pathname || undefined,
					prerender,
					fallbackRoutes: [],
					distURL: [],
					origin: 'project',
				});
			}
		}
	}

	walk(localFs, pagesPath, [], []);
	return routes;
}

export function createRoutesFromEntries(
	entries: RouteEntry[],
	config: RoutingConfig,
	logger: AstroLogger,
	pagesDirRelative = 'src/pages',
): RouteData[] {
	const entriesByDir = groupEntriesByDir(entries);
	return createRoutesFromEntriesByDir(entriesByDir, config, logger, pagesDirRelative);
}

function createRoutesFromEntriesByDir(
	entriesByDir: Map<string, RouteEntry[]>,
	config: RoutingConfig,
	logger: AstroLogger,
	pagesDirRelative: string,
): RouteData[] {
	const routes: RouteData[] = [];
	const validPageExtensions = new Set<string>(['.astro', ...config.pageExtensions]);
	const invalidPotentialPages = new Set<string>(['.tsx', '.jsx', '.vue', '.svelte']);
	const validEndpointExtensions = new Set<string>(['.js', '.ts']);
	const prerender = getPrerenderDefault(config);

	function walk(dir: string, parentSegments: RoutePart[][], parentParams: string[]) {
		const items: Item[] = [];
		const dirEntries = entriesByDir.get(dir) ?? [];
		for (const entry of dirEntries) {
			const basename = path.posix.basename(entry.path);
			const ext = path.extname(basename);
			const name = ext ? basename.slice(0, -ext.length) : basename;
			const isDir = entry.isDir;
			const file = slash(path.posix.join(pagesDirRelative, entry.path));

			if (name[0] === '_') {
				continue;
			}
			if (basename[0] === '.' && basename !== '.well-known') {
				continue;
			}
			if (!isDir && !validPageExtensions.has(ext) && !validEndpointExtensions.has(ext)) {
				if (invalidPotentialPages.has(ext)) {
					logger.warn(
						null,
						`Unsupported file type ${colors.bold(
							file,
						)} found in pages directory. Only Astro files can be used as pages. Prefix filename with an underscore (\`_\`) to ignore this warning, or move the file outside of the pages directory.`,
					);
				}
				continue;
			}

			const segment = isDir ? basename : name;
			validateSegment(segment, file);

			const parts = getParts(segment, file);
			const isIndex = isDir ? false : basename.substring(0, basename.lastIndexOf('.')) === 'index';
			const routeSuffix = basename.slice(basename.indexOf('.'), -ext.length);
			const isPage = validPageExtensions.has(ext);

			items.push({
				basename,
				ext,
				parts,
				file,
				isDir,
				isIndex,
				isPage,
				routeSuffix,
			});
		}

		for (const item of items) {
			const segments = parentSegments.slice();

			if (item.isIndex) {
				if (item.routeSuffix) {
					if (segments.length > 0) {
						const lastSegment = segments[segments.length - 1].slice();
						const lastPart = lastSegment[lastSegment.length - 1];

						if (lastPart.dynamic) {
							lastSegment.push({
								dynamic: false,
								spread: false,
								content: item.routeSuffix,
							});
						} else {
							lastSegment[lastSegment.length - 1] = {
								dynamic: false,
								spread: false,
								content: `${lastPart.content}${item.routeSuffix}`,
							};
						}

						segments[segments.length - 1] = lastSegment;
					} else {
						segments.push(item.parts);
					}
				}
			} else {
				segments.push(item.parts);
			}

			const params = parentParams.slice();
			params.push(...item.parts.filter((p) => p.dynamic).map((p) => p.content));

			if (item.isDir) {
				walk(path.posix.join(dir, item.basename), segments, params);
			} else {
				const component = item.file;
				const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
					? `/${segments.map((segment) => segment[0].content).join('/')}`
					: null;
				const route = joinSegments(segments);
				const trailingSlash = trailingSlashForPath(
					pathname,
					config,
					item.isPage ? 'page' : 'endpoint',
					route,
				);
				const pattern = getPattern(segments, config.base, trailingSlash);
				routes.push({
					route,
					isIndex: item.isIndex,
					type: item.isPage ? 'page' : 'endpoint',
					pattern,
					segments,
					params,
					component,
					pathname: pathname || undefined,
					prerender,
					fallbackRoutes: [],
					distURL: [],
					origin: 'project',
				});
			}
		}
	}

	walk('', [], []);
	return routes;
}

function groupEntriesByDir(entries: RouteEntry[]): Map<string, RouteEntry[]> {
	const entriesByDir = new Map<string, RouteEntry[]>();

	for (const entry of entries) {
		const normalizedPath = slash(entry.path);
		const dir = path.posix.dirname(normalizedPath);
		const key = dir === '.' ? '' : dir;
		const list = entriesByDir.get(key);
		const normalizedEntry =
			normalizedPath === entry.path ? entry : { ...entry, path: normalizedPath };
		if (list) {
			list.push(normalizedEntry);
		} else {
			entriesByDir.set(key, [normalizedEntry]);
		}
	}

	return entriesByDir;
}

// Get trailing slash rule for a path, based on the config and whether the path has an extension.
// Only endpoints with file extensions (like /feed.xml) should force 'never' for trailing slashes.
// Pages with dots in their names (like /hello.world) should respect the user's trailingSlash config.
const trailingSlashForPath = (
	pathname: string | null,
	config: Pick<RouterConfig, 'trailingSlash'>,
	type: 'page' | 'endpoint',
	route?: string,
): RouterConfig['trailingSlash'] =>
	type === 'endpoint' && hasFileExtension(pathname ?? route ?? '') ? 'never' : config.trailingSlash;

function createInjectedRoutes({
	config,
	cwd,
	injectedRoutes = [],
}: CreateRoutesListParams): RouteData[] {
	const prerender = getPrerenderDefault(config);

	const routes: RouteData[] = [];

	for (const injectedRoute of injectedRoutes) {
		const {
			pattern: name,
			entrypoint,
			prerender: prerenderInjected,
			origin = 'external',
		} = injectedRoute;
		const { resolved, component } = resolveInjectedRoute(entrypoint.toString(), config.root, cwd);

		const segments = removeLeadingForwardSlash(name)
			.split(path.posix.sep)
			.filter(Boolean)
			.map((s: string) => {
				validateSegment(s);
				return getParts(s, component);
			});

		const type = resolved.endsWith('.astro') ? 'page' : 'endpoint';
		const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
			? `/${segments.map((segment) => segment[0].content).join('/')}`
			: null;

		const route = joinSegments(segments);
		const trailingSlash = trailingSlashForPath(pathname, config, type, route);
		const pattern = getPattern(segments, config.base, trailingSlash);
		const params = segments
			.flat()
			.filter((p) => p.dynamic)
			.map((p) => p.content);

		routes.push({
			type,
			// For backwards compatibility, an injected route is never considered an index route.
			isIndex: false,
			route,
			pattern,
			segments,
			params,
			component,
			pathname: pathname || void 0,
			prerender: prerenderInjected ?? prerender,
			fallbackRoutes: [],
			distURL: [],
			origin,
		});
	}

	return routes;
}

function createInternalRoutes({ config, cwd, internalRoutes = [] }: CreateRoutesListParams) {
	return internalRoutes.map((route) => {
		const { resolved, component } = resolveInjectedRoute(
			route.entrypoint.toString(),
			config.root,
			cwd,
		);
		return parseRoute(route.pattern, config, {
			component,
			type: resolved.endsWith('.astro') ? 'page' : 'endpoint',
			origin: 'internal',
			isIndex: false,
			prerender: false,
		});
	});
}

/**
 * Create route data for all configured redirects.
 */
function createRedirectRoutes(
	{ config }: CreateRoutesListParams,
	routeMap: Map<string, RouteData>,
): RouteData[] {
	const trailingSlash = config.trailingSlash;

	const routes: RouteData[] = [];

	for (const [from, to] of Object.entries(config.redirects)) {
		const segments = removeLeadingForwardSlash(from)
			.split(path.posix.sep)
			.filter(Boolean)
			.map((s: string) => {
				validateSegment(s);
				return getParts(s, from);
			});

		const pattern = getPattern(segments, config.base, trailingSlash);
		const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
			? `/${segments.map((segment) => segment[0].content).join('/')}`
			: null;
		const params = segments
			.flat()
			.filter((p) => p.dynamic)
			.map((p) => p.content);
		const route = joinSegments(segments);

		let destination: string;
		if (typeof to === 'string') {
			destination = to;
		} else {
			destination = to.destination;
		}

		// check if the link starts with http or https; if not, throw an error
		if (URL.canParse(destination) && !/^https?:\/\//.test(destination)) {
			throw new AstroError({
				...UnsupportedExternalRedirect,
				message: UnsupportedExternalRedirect.message(from, destination),
			});
		}

		const redirectRoute = routeMap.get(destination);

		// If the source has dynamic params and the redirect will be prerendered,
		// we need a valid redirectRoute to map them. Without it, the build will fail
		// later with a misleading error. Catch this early and provide a clear error message.
		if (
			params.length > 0 &&
			!redirectRoute &&
			!URL.canParse(destination) &&
			getPrerenderDefault(config)
		) {
			throw new AstroError({
				...InvalidRedirectDestination,
				message: InvalidRedirectDestination.message(from, destination),
			});
		}

		// If the source has dynamic params and the destination route exists but has
		// fewer params, the build will fail later with a misleading error (e.g.,
		// "getStaticPaths required" pointing at the wrong file). Catch this early.
		if (
			params.length > 0 &&
			redirectRoute &&
			!URL.canParse(destination) &&
			getPrerenderDefault(config)
		) {
			const destParams = redirectRoute.params ?? [];
			const missingParams = params.filter((p) => !destParams.includes(p));
			if (missingParams.length > 0) {
				throw new AstroError({
					...InvalidRedirectDestination,
					message: InvalidRedirectDestination.message(from, destination, missingParams),
				});
			}
		}

		routes.push({
			type: 'redirect',
			// For backwards compatibility, a redirect is never considered an index route.
			isIndex: false,
			route,
			pattern,
			segments,
			params,
			component: from,
			pathname: pathname || void 0,
			prerender: getPrerenderDefault(config),
			redirect: to,
			redirectRoute,
			fallbackRoutes: [],
			distURL: [],
			origin: 'project',
		});
	}

	return routes;
}

/**
 * Checks whether a route segment is static.
 */
function isStaticSegment(segment: RoutePart[]) {
	return segment.every((part) => !part.dynamic && !part.spread);
}

/**
 * Check whether two are sure to collide in clearly unintended ways report appropriately.
 *
 * Fallback routes are never considered to collide with any other route.
 * Routes that may collide depending on the parameters returned by their `getStaticPaths`
 * are not reported as collisions at this stage.
 *
 * Two routes are guaranteed to collide in the following scenarios:
 * - Both are the exact same static route.
 * 	 For example, `/foo` from an injected route and `/foo` from a file in the project.
 * - Both are non-prerendered dynamic routes with equal static parts in matching positions
 *   and dynamic parts of same type in the same positions.
 *   For example, `/foo/[bar]` and `/foo/[baz]` or `/foo/[...bar]` and `/foo/[...baz]`
 *     but not `/foo/[bar]` and `/foo/[...baz]`.
 */
function detectRouteCollision(a: RouteData, b: RouteData, logger: AstroLogger) {
	if (a.type === 'fallback' || b.type === 'fallback') {
		// If either route is a fallback route, they don't collide.
		// Fallbacks are always added below other routes exactly to avoid collisions.
		return;
	}

	if (
		a.route === b.route &&
		a.segments.every(isStaticSegment) &&
		b.segments.every(isStaticSegment)
	) {
		// If both routes are the same and completely static they are guaranteed to collide
		// such that one of them will never be matched.
		logger.warn(
			'router',
			`The route "${a.route}" is defined in both "${a.component}" and "${b.component}". A static route cannot be defined more than once.`,
		);
		logger.warn(
			'router',
			'A collision will result in a hard error in following versions of Astro.',
		);
		return;
	}

	if (a.prerender || b.prerender) {
		// If either route is prerendered, it is impossible to know if they collide
		// at this stage because it depends on the parameters returned by `getStaticPaths`.
		return;
	}

	if (a.segments.length !== b.segments.length) {
		// If the routes have different number of segments, they cannot perfectly overlap
		// each other, so a collision is either not guaranteed or may be intentional.
		return;
	}

	// Routes have the same number of segments, can use either.
	const segmentCount = a.segments.length;

	for (let index = 0; index < segmentCount; index++) {
		const segmentA = a.segments[index];
		const segmentB = b.segments[index];

		if (!isSemanticallyEqualSegment(segmentA, segmentB)) {
			// If any segment is not semantically equal between the routes
			// it is not certain that the routes collide.
			return;
		}
	}

	// Both routes are guaranteed to collide such that one will never be matched.
	logger.warn(
		'router',
		`The route "${a.route}" is defined in both "${a.component}" and "${b.component}" using SSR mode. A dynamic SSR route cannot be defined more than once.`,
	);
	logger.warn('router', 'A collision will result in a hard error in following versions of Astro.');
}

function isScannedRoute(route: RouteData) {
	return route.type === 'page' || route.type === 'endpoint' || route.type === 'redirect';
}

/**
 * Create a full route manifest from filesystem and injected routes.
 */
export async function createRoutesList(
	params: CreateRoutesListParams,
	logger: AstroLogger,
	{
		dev = false,
	}: {
		dev?: boolean;
	} = {},
): Promise<CreatedRoutesList> {
	if (params.pageExtensions?.length) {
		const pageExtensions = [
			...new Set([...params.config.pageExtensions, ...params.pageExtensions]),
		];
		params = { ...params, config: { ...params.config, pageExtensions } };
	}
	const { config } = params;
	// Create a map of all routes so redirects can refer to any route
	const routeMap = new Map();

	const fileBasedRoutes = createFileBasedRoutes(params, logger);
	for (const route of fileBasedRoutes) {
		routeMap.set(route.route, route);
	}

	const injectedRoutes = createInjectedRoutes(params);
	for (const route of injectedRoutes) {
		routeMap.set(route.route, route);
	}

	const redirectRoutes = createRedirectRoutes(params, routeMap);

	// we remove the file based routes that were deemed redirects
	const filteredFiledBasedRoutes = fileBasedRoutes.filter((fileBasedRoute) => {
		const isRedirect = redirectRoutes.findIndex((rd) => rd.route === fileBasedRoute.route);
		return isRedirect < 0;
	});

	let routes: RouteData[] = [
		...[...filteredFiledBasedRoutes, ...injectedRoutes, ...redirectRoutes].sort(routeComparator),
	];

	// Check the prerender option for each route
	const limit = pLimit(10);
	let promises = [];
	for (const route of routes) {
		promises.push(
			limit(async () => {
				if (!isScannedRoute(route)) return;
				// External redirects aren't taken into account
				if (route.type === 'redirect' && !route.redirectRoute) return;
				const localFs = params.fsMod ?? nodeFs;
				const componentUrl = new URL(
					// The destination redirect might be a prerendered
					route.type === 'redirect' && route.redirectRoute
						? route.redirectRoute.component
						: route.component,
					config.root,
				);
				const content = await localFs.promises.readFile(componentUrl, 'utf-8');

				await getRoutePrerenderOption(content, route, params.onRouteSetup);
			}),
		);
	}
	await Promise.all(promises);
	const buildOutput =
		!getPrerenderDefault(config) ||
		routes.some((route) => isScannedRoute(route) && !route.prerender)
			? 'server'
			: 'static';

	// Report route collisions
	for (const [index, higherRoute] of routes.entries()) {
		for (const lowerRoute of routes.slice(index + 1)) {
			detectRouteCollision(higherRoute, lowerRoute, logger);
		}
	}

	for (const transform of params.routeTransforms ?? []) {
		routes =
			transform(routes, {
				base: config.base,
				trailingSlash: config.trailingSlash,
				root: config.root,
				srcDir: config.srcDir,
			}) ?? routes;
	}

	if (dev) {
		// In SSR, a 404 route is injected in the App directly for some special handling,
		// it must not appear in the manifest
		ensure404Route({ routes });
	}
	if (dev || buildOutput === 'server') {
		routes.unshift(...createInternalRoutes(params));
	}

	// If an adapter is added, we unconditionally inject the server islands route.
	// Ideally we would only inject the server islands route if server islands are used in the project.
	// Unfortunately, there is a "circular dependency": to know if server islands are used, we need to run
	// the build but the build relies on the routes manifest.
	if (dev || params.serverIslands) {
		injectServerIslandRoute(config, { routes });
	}

	return { routes, buildOutput };
}

/**
 * Resolve a route entrypoint to an absolute component path.
 */
export function resolveInjectedRoute(entrypoint: string, root: URL, cwd?: string) {
	let resolved;
	try {
		resolved = require.resolve(entrypoint, { paths: [cwd || fileURLToPath(root)] });
	} catch {
		resolved = fileURLToPath(new URL(entrypoint, root));
	}

	return {
		resolved: resolved,
		component: slash(path.relative(cwd || fileURLToPath(root), resolved)),
	};
}

function joinSegments(segments: RoutePart[][]): string {
	const arr = segments.map((segment) => {
		return segment.map((rp) => (rp.dynamic ? `[${rp.content}]` : rp.content)).join('');
	});

	return `/${arr.join('/')}`;
}
