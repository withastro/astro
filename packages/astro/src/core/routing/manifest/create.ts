import type {
	AstroConfig,
	AstroSettings,
	RoutePriorityOverride,
	ManifestData,
	RouteData,
	RoutePart,
} from '../../../@types/astro.js';
import type { Logger } from '../../logger/core.js';

import { bold } from 'kleur/colors';
import { createRequire } from 'module';
import nodeFs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPrerenderDefault } from '../../../prerender/utils.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from '../../constants.js';
import { removeLeadingForwardSlash, slash } from '../../path.js';
import { resolvePages } from '../../util.js';
import { getRouteGenerator } from './generator.js';
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

function countOccurrences(needle: string, haystack: string) {
	let count = 0;
	for (const hay of haystack) {
		if (hay === needle) count += 1;
	}
	return count;
}

function getParts(part: string, file: string) {
	const result: RoutePart[] = [];
	part.split(/\[(.+?\(.+?\)|.+?)\]/).map((str, i) => {
		if (!str) return;
		const dynamic = i % 2 === 1;

		const [, content] = dynamic ? /([^(]+)$/.exec(str) || [null, null] : [null, str];

		if (!content || (dynamic && !/^(\.\.\.)?[a-zA-Z0-9_$]+$/.test(content))) {
			throw new Error(`Invalid route ${file} — parameter name must match /^[a-zA-Z0-9_$]+$/`);
		}

		result.push({
			content,
			dynamic,
			spread: dynamic && /^\.{3}.+$/.test(content),
		});
	});

	return result;
}

function getPattern(
	segments: RoutePart[][],
	config: AstroConfig,
	addTrailingSlash: AstroConfig['trailingSlash']
) {
	const base = config.base;
	const pathname = segments
		.map((segment) => {
			if (segment.length === 1 && segment[0].spread) {
				return '(?:\\/(.*?))?';
			} else {
				return (
					'\\/' +
					segment
						.map((part) => {
							if (part.spread) {
								return '(.*?)';
							} else if (part.dynamic) {
								return '([^/]+?)';
							} else {
								return part.content
									.normalize()
									.replace(/\?/g, '%3F')
									.replace(/#/g, '%23')
									.replace(/%5B/g, '[')
									.replace(/%5D/g, ']')
									.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
							}
						})
						.join('')
				);
			}
		})
		.join('');

	const trailing =
		addTrailingSlash && segments.length ? getTrailingSlashPattern(addTrailingSlash) : '$';
	let initial = '\\/';
	if (addTrailingSlash === 'never' && base !== '/') {
		initial = '';
	}
	return new RegExp(`^${pathname || initial}${trailing}`);
}

function getTrailingSlashPattern(addTrailingSlash: AstroConfig['trailingSlash']): string {
	if (addTrailingSlash === 'always') {
		return '\\/$';
	}
	if (addTrailingSlash === 'never') {
		return '$';
	}
	return '\\/?$';
}

function validateSegment(segment: string, file = '') {
	if (!file) file = segment;

	if (/\]\[/.test(segment)) {
		throw new Error(`Invalid route ${file} \u2014 parameters must be separated`);
	}
	if (countOccurrences('[', segment) !== countOccurrences(']', segment)) {
		throw new Error(`Invalid route ${file} \u2014 brackets are unbalanced`);
	}
	if (
		(/.+\[\.\.\.[^\]]+\]/.test(segment) || /\[\.\.\.[^\]]+\].+/.test(segment)) &&
		file.endsWith('.astro')
	) {
		throw new Error(`Invalid route ${file} \u2014 rest parameter must be a standalone segment`);
	}
}

/**
 * Comparator for sorting routes in resolution order.
 *
 * The routes are sorted in by the following rules in order, following the first rule that
 * applies:
 * - More specific routes are sorted before less specific routes. Here, "specific" means
 *   the number of segments in the route, so a parent route is always sorted after its children.
 *   For example, `/foo/bar` is sorted before `/foo`.
 * - Static routes are sorted before dynamic routes.
 *   For example, `/foo/bar` is sorted before `/foo/[bar]`.
 * - Dynamic routes with single parameters are sorted before dynamic routes with rest parameters.
 *   For example, `/foo/[bar]` is sorted before `/foo/[...bar]`.
 * - Prerendered routes are sorted before non-prerendered routes.
 * - Endpoints are sorted before pages.
 *   For example, a file `/foo.ts` is sorted before `/bar.astro`.
 * - If both routes are equal regarding all previosu conditions, they are sorted alphabetically.
 *   For example, `/bar` is sorted before `/foo`.
 *   The definition of "alphabetically" is dependent on the default locale of the running system.
 */
function routeComparator(a: RouteData, b: RouteData) {
	// Sort more specific routes before less specific routes
	if (a.segments.length !== b.segments.length) {
		return a.segments.length > b.segments.length ? -1 : 1;
	}

	const aIsStatic = a.segments.every((segment) => segment.every((part) => !part.dynamic && !part.spread));
	const bIsStatic = b.segments.every((segment) => segment.every((part) => !part.dynamic && !part.spread));

	// Sort static routes before dynamic routes
	if (aIsStatic !== bIsStatic) {
		return aIsStatic ? -1 : 1;
	}

	const aHasSpread = a.segments.some((segment) => segment.some((part) => part.spread));
	const bHasSpread = b.segments.some((segment) => segment.some((part) => part.spread));

	// Sort dynamic routes with rest parameters after dynamic routes with single parameters
	// (also after static, but that is already covered by the previous condition)
	if (aHasSpread !== bHasSpread) {
		return aHasSpread ? 1 : -1;
	}

	// Sort prerendered routes before non-prerendered routes
	if (a.prerender !== b.prerender) {
		return a.prerender ? -1 : 1;
	}

	// Sort endpoints before pages
	if ((a.type === 'endpoint') !== (b.type === 'endpoint')) {
		return a.type === 'endpoint' ? -1 : 1;
	}

	// Sort alphabetically
	return a.route.localeCompare(b.route);
}

export interface CreateRouteManifestParams {
	/** Astro Settings object */
	settings: AstroSettings;
	/** Current working directory */
	cwd?: string;
	/** fs module, for testing */
	fsMod?: typeof nodeFs;
}

function createFileBasedRoutes(
	{settings, cwd, fsMod}: CreateRouteManifestParams,
	logger: Logger,
): RouteData[] {
	const components: string[] = [];
	const routes: RouteData[] = [];
	const validPageExtensions = new Set<string>([
		'.astro',
		...SUPPORTED_MARKDOWN_FILE_EXTENSIONS,
		...settings.pageExtensions,
	]);
	const validEndpointExtensions = new Set<string>(['.js', '.ts']);
	const localFs = fsMod ?? nodeFs;
	const prerender = getPrerenderDefault(settings.config);

	function walk(
		fs: typeof nodeFs,
		dir: string,
		parentSegments: RoutePart[][],
		parentParams: string[],
	) {
		let items: Item[] = [];
		for (const basename of fs.readdirSync(dir)) {
			const resolved = path.join(dir, basename);
			const file = slash(path.relative(cwd || fileURLToPath(settings.config.root), resolved));
			const isDir = fs.statSync(resolved).isDirectory();

			const ext = path.extname(basename);
			const name = ext ? basename.slice(0, -ext.length) : basename;

			if (name[0] === '_') {
				return;
			}
			if (basename[0] === '.' && basename !== '.well-known') {
				return;
			}
			// filter out "foo.astro_tmp" files, etc
			if (!isDir && !validPageExtensions.has(ext) && !validEndpointExtensions.has(ext)) {
				logger.warn(
					null,
					`Unsupported file type ${bold(
						resolved,
					)} found. Prefix filename with an underscore (\`_\`) to ignore.`,
				);

				return;
			}
			const segment = isDir ? basename : name;
			validateSegment(segment, file);

			const parts = getParts(segment, file);
			const isIndex = isDir ? false : basename.startsWith('index.');
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
		;

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
				components.push(item.file);
				const component = item.file;
				const trailingSlash = item.isPage ? settings.config.trailingSlash : 'never';
				const pattern = getPattern(segments, settings.config, trailingSlash);
				const generate = getRouteGenerator(segments, trailingSlash);
				const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
					? `/${segments.map((segment) => segment[0].content).join('/')}`
					: null;
				const route = `/${segments
					.map(([{dynamic, content}]) => (dynamic ? `[${content}]` : content))
					.join('/')}`.toLowerCase();
				routes.push({
					route,
					type: item.isPage ? 'page' : 'endpoint',
					pattern,
					segments,
					params,
					component,
					generate,
					pathname: pathname || undefined,
					prerender,
					fallbackRoutes: [],
				});
			}
		}
		;
	}

	const {config} = settings;
	const pages = resolvePages(config);

	if (localFs.existsSync(pages)) {
		walk(localFs, fileURLToPath(pages), [], []);
	} else if (settings.injectedRoutes.length === 0) {
		const pagesDirRootRelative = pages.href.slice(settings.config.root.href.length);
		logger.warn(null, `Missing pages directory: ${pagesDirRootRelative}`);
	}

	return routes;
}

type PrioritizedRoutesData = Record<RoutePriorityOverride, RouteData[]>;

function createInjectedRoutes({settings, cwd}: CreateRouteManifestParams): PrioritizedRoutesData {
	const {config} = settings;
	const prerender = getPrerenderDefault(config);

	const routes: PrioritizedRoutesData = {
		'normal': [],
		'legacy': [],
	};

	for (const injectedRoute of settings.injectedRoutes) {
		const {pattern: name, entrypoint, prerender: prerenderInjected, priority} = injectedRoute;
		let resolved: string;
		try {
			resolved = require.resolve(entrypoint, {paths: [cwd || fileURLToPath(config.root)]});
		} catch (e) {
			resolved = fileURLToPath(new URL(entrypoint, config.root));
		}
		const component = slash(path.relative(cwd || fileURLToPath(config.root), resolved));

		const segments = removeLeadingForwardSlash(name)
			.split(path.posix.sep)
			.filter(Boolean)
			.map((s: string) => {
				validateSegment(s);
				return getParts(s, component);
			});

		const type = resolved.endsWith('.astro') ? 'page' : 'endpoint';
		const isPage = type === 'page';
		const trailingSlash = isPage ? config.trailingSlash : 'never';

		const pattern = getPattern(segments, settings.config, trailingSlash);
		const generate = getRouteGenerator(segments, trailingSlash);
		const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
			? `/${segments.map((segment) => segment[0].content).join('/')}`
			: null;
		const params = segments
			.flat()
			.filter((p) => p.dynamic)
			.map((p) => p.content);
		const route = `/${segments
			.map(([{dynamic, content}]) => (dynamic ? `[${content}]` : content))
			.join('/')}`.toLowerCase();

		routes[priority ?? 'normal'].push({
			type,
			route,
			pattern,
			segments,
			params,
			component,
			generate,
			pathname: pathname || void 0,
			prerender: prerenderInjected ?? prerender,
			fallbackRoutes: [],
		});
	}
	;

	return routes;
}

/**
 * Create route data for all configured redirects.
 */
function createRedirectRoutes(
	{settings}: CreateRouteManifestParams,
	routeMap: Map<string, RouteData>,
	logger: Logger,
): PrioritizedRoutesData {
	const {config} = settings;
	const trailingSlash = config.trailingSlash;

	const routes: PrioritizedRoutesData = {
		'normal': [],
		'legacy': [],
	};

	for (const [from, to] of Object.entries(settings.config.redirects)) {
		const segments = removeLeadingForwardSlash(from)
			.split(path.posix.sep)
			.filter(Boolean)
			.map((s: string) => {
				validateSegment(s);
				return getParts(s, from);
			});

		const pattern = getPattern(segments, settings.config, trailingSlash);
		const generate = getRouteGenerator(segments, trailingSlash);
		const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
			? `/${segments.map((segment) => segment[0].content).join('/')}`
			: null;
		const params = segments
			.flat()
			.filter((p) => p.dynamic)
			.map((p) => p.content);
		const route = `/${segments
			.map(([{dynamic, content}]) => (dynamic ? `[${content}]` : content))
			.join('/')}`.toLowerCase();

		if (/^https?:\/\//.test(to.destination)) {
			logger.warn(
				'redirects',
				`Redirecting to an external URL is not officially supported: ${from} -> ${to.destination}`,
			);
		}

		routes[to.priority].push({
			type: 'redirect',
			route,
			pattern,
			segments,
			params,
			component: from,
			generate,
			pathname: pathname || void 0,
			prerender: false,
			redirect: 'status' in to
				? {
					status: to.status,
					destination: to.destination,
				}
				: to.destination,
			redirectRoute: routeMap.get(to.destination),
			fallbackRoutes: [],
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

/**
 * Check whether two routes collide and report appropriately.
 *
 * Routes the are statically guaranteed to collide will throw.
 * Routes that may collide depending on the parameters returned by `getStaticPaths` will log a warning.
 * Routes that may collide depending on whether they are prerendered will log a warning.
 *
 * Fallback routes are never considered to collide with any other route.
 *
 * Two routes are guarantted to collide, thus throwing an error, in the following scenarios:
 * - Both are the exact same static route.
 * 	 For example, `/foo` from an injected route and `/foo` from a file in the project.
 * - Both are non-prerendered dynamic routes with equal static parts in matching positions
 *   and dynamic parts of same type in the same positions.
 *   For example, `/foo/[bar]` and `/foo/[baz]` or `/foo/[...bar]` and `/foo/[...baz]`
 *     but not `/foo/[bar]` and `/foo/[...baz]`.
 *
 * Two routes may collide after building, thus showing a warning, in the following scenarios:
 * - Both are dynamic routes with equal static parts in matching positions,
 *   dynamic parts in the same positions, and at least one of them is prerendered.
 *   For example, `/foo/[bar]` and `/foo/[baz]` or `/foo/[...bar]` and `/foo/[...baz]`.
 * - Both routes share a common prefix and one of them is prerendered and follows the
 *   prefix with a rest parameter.
 *   For example, with a prefix `/foo`:
 *     - `/foo/[...bar]` and `/foo/baz`.
 *     - `/foo/[...bar]` and `/foo/baz/[qux]`.
 *     - `/foo/[...bar]` and `/foo/baz/[...qux]`.
 */
function detectRouteColision(a: RouteData, b: RouteData, logger: Logger) {
	if (a.type === 'fallback' || b.type === 'fallback') {
		// If either route is a fallback route, they don't collide.
		// Fallbacks are always added below other routes exactly to avoid collisions.
		return false;
	}

	if (a.route === b.route && a.segments.every(isStaticSegment) && b.segments.every(isStaticSegment)) {
		// If both routes are exactly the same, they collide
		// @todo Make this a pretty AstroError
		throw new Error(`The route ${a.route} is defined more than once`);
	}

	// Assume the routes collide for sure and update this assumptions if any rule says otherwise.
	let certainCollision = true;

	// Take the minimum of both length to iterate on
	// If one route is longer than the other, the segments exceeding the length
	// of the other route won't be paired.
	const minLength = Math.min(a.segments.length, b.segments.length);

	let index = 0;
	for (; index < minLength; index++) {
		const segmentA = a.segments[index];
		const segmentB = b.segments[index];

		if (isSemanticallyEqualSegment(segmentA, segmentB)) {
			// Semantically equal segments don't change our assumptions
			continue;
		}

		// If any segment is not semantically equal between the routes
		// it is not certain that the routes collide.
		certainCollision = false;

		if (isStaticSegment(segmentA) && isStaticSegment(segmentB)) {
			// If both segments are static and not equal then the routes
			// don't collide, e.g. `/foo/[bar]` and `/baz/[qux]`.
			return;
		}

		// From this segment on, the routes do not match one-to-one.
		break;
	}

	if (index === minLength - 1) {
		const aEndsWithSpread = a.segments.at(-1)?.[0].spread === true;
		const bEndsWithSpread = b.segments.at(-1)?.[0].spread === true;

		// If only one of the routes ends with a spread
		if (aEndsWithSpread !== bEndsWithSpread) {
			const restRoute = aEndsWithSpread ? a : b;
			// const possibleColisionRoute = aEndsWithSpread ? b : a;

			logger.warn('router', `The route ${restRoute.route} is defined more than once`);
		}
	}

	// if (hasDynamic && (a.prerender || b.prerender)) {
	// 	// If the route is dynamic and either of the routes is prerendered,
	// 	// we cannot afirm that they collide at this point.
	// 	// They will only collide if both routes are prerendered and return
	// 	// the same parameters on `getStaticPaths`, which is checked later.
	// 	return false;
	// }

	// If every segment and part is equivalent, they collide
	// return true;
}

/** Create manifest of all static routes */
export function createRouteManifest(
	params: CreateRouteManifestParams,
	logger: Logger,
): ManifestData {
	// Create a map of all routes so redirects can refer to any route
	const routeMap = new Map();

	const fileBasedRoutes = createFileBasedRoutes(params, logger);
	for (const route of fileBasedRoutes) {
		routeMap.set(route.route, route);
	}

	const injectedRoutes = createInjectedRoutes(params);
	for (const [, routes] of Object.entries(injectedRoutes)) {
		for (const route of routes) {
			routeMap.set(route.route, route);
		}
	}

	const redirectRoutes = createRedirectRoutes(params, routeMap, logger);

	const routes: RouteData[] = [
		...injectedRoutes['legacy'].sort(routeComparator),
		...[
			...fileBasedRoutes,
			...injectedRoutes['normal'],
			...redirectRoutes['normal'],
		].sort(routeComparator),
		...redirectRoutes['legacy'].sort(routeComparator),
	];

	// Report route collisions
	for (const [index, higherRoute] of routes.entries()) {
		for (const lowerRoute of routes.slice(index + 1)) {
			detectRouteColision(higherRoute, lowerRoute, logger)
		}
	}

	const {settings} = params;
	const {config} = settings;

	const i18n = settings.config.i18n;
	if (i18n) {
		// In this block of code we group routes based on their locale

		// A map like: locale => RouteData[]
		const routesByLocale = new Map<string, RouteData[]>();
		// This type is here only as a helper. We copy the routes and make them unique, so we don't "process" the same route twice.
		// The assumption is that a route in the file system belongs to only one locale.
		const setRoutes = new Set(routes.filter((route) => route.type === 'page'));

		// First loop
		// We loop over the locales minus the default locale and add only the routes that contain `/<locale>`.
		const filteredLocales = i18n.locales
			.filter((loc) => {
				if (typeof loc === 'string') {
					return loc !== i18n.defaultLocale;
				}
				return loc.path !== i18n.defaultLocale;
			})
			.map((locale) => {
				if (typeof locale === 'string') {
					return locale;
				}
				return locale.path;
			});
		for (const locale of filteredLocales) {
			for (const route of setRoutes) {
				if (!route.route.includes(`/${locale}`)) {
					continue;
				}
				const currentRoutes = routesByLocale.get(locale);
				if (currentRoutes) {
					currentRoutes.push(route);
					routesByLocale.set(locale, currentRoutes);
				} else {
					routesByLocale.set(locale, [route]);
				}
				setRoutes.delete(route);
			}
		}

		// we loop over the remaining routes and add them to the default locale
		for (const route of setRoutes) {
			const currentRoutes = routesByLocale.get(i18n.defaultLocale);
			if (currentRoutes) {
				currentRoutes.push(route);
				routesByLocale.set(i18n.defaultLocale, currentRoutes);
			} else {
				routesByLocale.set(i18n.defaultLocale, [route]);
			}
			setRoutes.delete(route);
		}

		// Work done, now we start creating "fallback" routes based on the configuration

		if (i18n.routing === 'prefix-always') {
			// we attempt to retrieve the index page of the default locale
			const defaultLocaleRoutes = routesByLocale.get(i18n.defaultLocale);
			if (defaultLocaleRoutes) {
				const indexDefaultRoute = defaultLocaleRoutes.find((routeData) => {
					// it should be safe to assume that an index page has "index" in their name
					return routeData.component.includes('index');
				});
				if (indexDefaultRoute) {
					// we found the index of the default locale, now we create a root index that will redirect to the index of the default locale
					const pathname = '/';
					const route = '/';

					const segments = removeLeadingForwardSlash(route)
						.split(path.posix.sep)
						.filter(Boolean)
						.map((s: string) => {
							validateSegment(s);
							return getParts(s, route);
						});

					routes.push({
						...indexDefaultRoute,
						pathname,
						route,
						segments,
						pattern: getPattern(segments, config, config.trailingSlash),
						type: 'fallback',
					});
				}
			}
		}

		if (i18n.fallback) {
			let fallback = Object.entries(i18n.fallback);

			if (fallback.length > 0) {
				for (const [fallbackFromLocale, fallbackToLocale] of fallback) {
					let fallbackToRoutes;
					if (fallbackToLocale === i18n.defaultLocale) {
						fallbackToRoutes = routesByLocale.get(i18n.defaultLocale);
					} else {
						fallbackToRoutes = routesByLocale.get(fallbackToLocale);
					}
					const fallbackFromRoutes = routesByLocale.get(fallbackFromLocale);

					// Technically, we should always have a fallback to. Added this to make TS happy.
					if (!fallbackToRoutes) {
						continue;
					}

					for (const fallbackToRoute of fallbackToRoutes) {
						const hasRoute =
							fallbackFromRoutes &&
							// we check if the fallback from locale (the origin) has already this route
							fallbackFromRoutes.some((route) => {
								if (fallbackToLocale === i18n.defaultLocale) {
									return (
										route.route.replace(`/${fallbackFromLocale}`, '') === fallbackToRoute.route
									);
								} else {
									return (
										route.route.replace(`/${fallbackToLocale}`, `/${fallbackFromLocale}`) ===
										fallbackToRoute.route
									);
								}
							});

						if (!hasRoute) {
							let pathname: string | undefined;
							let route: string;
							if (
								fallbackToLocale === i18n.defaultLocale &&
								i18n.routing === 'prefix-other-locales'
							) {
								if (fallbackToRoute.pathname) {
									pathname = `/${fallbackFromLocale}${fallbackToRoute.pathname}`;
								}
								route = `/${fallbackFromLocale}${fallbackToRoute.route}`;
							} else {
								pathname = fallbackToRoute.pathname
									?.replace(`/${fallbackToLocale}/`, `/${fallbackFromLocale}/`)
									.replace(`/${fallbackToLocale}`, `/${fallbackFromLocale}`);
								route = fallbackToRoute.route
									.replace(`/${fallbackToLocale}`, `/${fallbackFromLocale}`)
									.replace(`/${fallbackToLocale}/`, `/${fallbackFromLocale}/`);
							}
							const segments = removeLeadingForwardSlash(route)
								.split(path.posix.sep)
								.filter(Boolean)
								.map((s: string) => {
									validateSegment(s);
									return getParts(s, route);
								});
							const generate = getRouteGenerator(segments, config.trailingSlash);
							const index = routes.findIndex((r) => r === fallbackToRoute);
							if (index >= 0) {
								const fallbackRoute: RouteData = {
									...fallbackToRoute,
									pathname,
									route,
									segments,
									generate,
									pattern: getPattern(segments, config, config.trailingSlash),
									type: 'fallback',
									fallbackRoutes: [],
								};
								const routeData = routes[index];
								routeData.fallbackRoutes.push(fallbackRoute);
							}
						}
					}
				}
			}
		}
	}

	return {
		routes,
	};
}
