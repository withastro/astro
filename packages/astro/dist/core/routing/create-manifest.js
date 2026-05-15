import nodeFs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pLimit from 'p-limit';
import colors from 'piccolore';
import { injectImageEndpoint } from '../../assets/endpoint/config.js';
import { runHookRoutesResolved } from '../../integrations/hooks.js';
import { getPrerenderDefault } from '../../prerender/utils.js';
import { toRoutingStrategy } from '../app/entrypoints/index.js';
import { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from '../constants.js';
import {
	InvalidRedirectDestination,
	MissingIndexForInternationalization,
	UnsupportedExternalRedirect,
} from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { hasFileExtension, removeLeadingForwardSlash, slash } from '../path.js';
import { injectServerIslandRoute } from '../server-islands/endpoint.js';
import { resolvePages } from '../util.js';
import { ensure404Route } from './astro-designed-error-pages.js';
import { routeComparator } from './priority.js';
import { getPattern } from './pattern.js';
import { getRoutePrerenderOption } from './prerender.js';
import { validateSegment } from './segment.js';
const require2 = createRequire(import.meta.url);
const ROUTE_DYNAMIC_SPLIT = /\[([^[\]()]+(?:\([^)]+\))?)\]/;
const ROUTE_SPREAD = /^\.{3}.+$/;
function getParts(part, file) {
	const result = [];
	part.split(ROUTE_DYNAMIC_SPLIT).map((str, i) => {
		if (!str) return;
		const dynamic = i % 2 === 1;
		const [, content] = dynamic ? /([^(]+)$/.exec(str) || [null, null] : [null, str];
		if (!content || (dynamic && !/^(?:\.\.\.)?[\w$]+$/.test(content))) {
			throw new Error(`Invalid route ${file} \u2014 parameter name must match /^[a-zA-Z0-9_$]+$/`);
		}
		result.push({
			content,
			dynamic,
			spread: dynamic && ROUTE_SPREAD.test(content),
		});
	});
	return result;
}
function isSemanticallyEqualSegment(segmentA, segmentB) {
	if (segmentA.length !== segmentB.length) {
		return false;
	}
	for (const [index, partA] of segmentA.entries()) {
		const partB = segmentB[index];
		if (partA.dynamic !== partB.dynamic || partA.spread !== partB.spread) {
			return false;
		}
		if (!partA.dynamic && partA.content !== partB.content) {
			return false;
		}
	}
	return true;
}
function createFileBasedRoutes({ settings, cwd, fsMod }, logger) {
	const { config } = settings;
	const pages = resolvePages(config);
	const localFs = fsMod ?? nodeFs;
	const rootPath = fileURLToPath(config.root);
	const pagesPath = fileURLToPath(pages);
	if (!localFs.existsSync(pages)) {
		if (settings.injectedRoutes.length === 0) {
			const pagesDirRootRelative = pages.href.slice(settings.config.root.href.length);
			logger.warn(null, `Missing pages directory: ${pagesDirRootRelative}`);
		}
		return [];
	}
	const routes = [];
	const validPageExtensions = /* @__PURE__ */ new Set([
		'.astro',
		...SUPPORTED_MARKDOWN_FILE_EXTENSIONS,
		...settings.pageExtensions,
	]);
	const invalidPotentialPages = /* @__PURE__ */ new Set(['.tsx', '.jsx', '.vue', '.svelte']);
	const validEndpointExtensions = /* @__PURE__ */ new Set(['.js', '.ts']);
	const prerender = getPrerenderDefault(settings.config);
	function walk(fs, dir, parentSegments, parentParams) {
		const items = [];
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
				const trailingSlash = trailingSlashForPath(
					pathname,
					settings.config,
					item.isPage ? 'page' : 'endpoint',
				);
				const pattern = getPattern(segments, settings.config.base, trailingSlash);
				const route = joinSegments(segments);
				routes.push({
					route,
					isIndex: item.isIndex,
					type: item.isPage ? 'page' : 'endpoint',
					pattern,
					segments,
					params,
					component,
					pathname: pathname || void 0,
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
function createRoutesFromEntries(entries, settings, logger, pagesDirRelative = 'src/pages') {
	const entriesByDir = groupEntriesByDir(entries);
	return createRoutesFromEntriesByDir(entriesByDir, settings, logger, pagesDirRelative);
}
function createRoutesFromEntriesByDir(entriesByDir, settings, logger, pagesDirRelative) {
	const routes = [];
	const validPageExtensions = /* @__PURE__ */ new Set([
		'.astro',
		...SUPPORTED_MARKDOWN_FILE_EXTENSIONS,
		...settings.pageExtensions,
	]);
	const invalidPotentialPages = /* @__PURE__ */ new Set(['.tsx', '.jsx', '.vue', '.svelte']);
	const validEndpointExtensions = /* @__PURE__ */ new Set(['.js', '.ts']);
	const prerender = getPrerenderDefault(settings.config);
	function walk(dir, parentSegments, parentParams) {
		const items = [];
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
				const trailingSlash = trailingSlashForPath(
					pathname,
					settings.config,
					item.isPage ? 'page' : 'endpoint',
				);
				const pattern = getPattern(segments, settings.config.base, trailingSlash);
				const route = joinSegments(segments);
				routes.push({
					route,
					isIndex: item.isIndex,
					type: item.isPage ? 'page' : 'endpoint',
					pattern,
					segments,
					params,
					component,
					pathname: pathname || void 0,
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
function groupEntriesByDir(entries) {
	const entriesByDir = /* @__PURE__ */ new Map();
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
const trailingSlashForPath = (pathname, config, type) =>
	type === 'endpoint' && pathname && hasFileExtension(pathname) ? 'never' : config.trailingSlash;
function createInjectedRoutes({ settings, cwd }) {
	const { config } = settings;
	const prerender = getPrerenderDefault(config);
	const routes = [];
	for (const injectedRoute of settings.injectedRoutes) {
		const { pattern: name, entrypoint, prerender: prerenderInjected, origin } = injectedRoute;
		const { resolved, component } = resolveInjectedRoute(entrypoint.toString(), config.root, cwd);
		const segments = removeLeadingForwardSlash(name)
			.split(path.posix.sep)
			.filter(Boolean)
			.map((s) => {
				validateSegment(s);
				return getParts(s, component);
			});
		const type = resolved.endsWith('.astro') ? 'page' : 'endpoint';
		const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
			? `/${segments.map((segment) => segment[0].content).join('/')}`
			: null;
		const trailingSlash = trailingSlashForPath(pathname, config, type);
		const pattern = getPattern(segments, settings.config.base, trailingSlash);
		const params = segments
			.flat()
			.filter((p) => p.dynamic)
			.map((p) => p.content);
		const route = joinSegments(segments);
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
function createRedirectRoutes({ settings }, routeMap) {
	const { config } = settings;
	const trailingSlash = config.trailingSlash;
	const routes = [];
	for (const [from, to] of Object.entries(settings.config.redirects)) {
		const segments = removeLeadingForwardSlash(from)
			.split(path.posix.sep)
			.filter(Boolean)
			.map((s) => {
				validateSegment(s);
				return getParts(s, from);
			});
		const pattern = getPattern(segments, settings.config.base, trailingSlash);
		const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic)
			? `/${segments.map((segment) => segment[0].content).join('/')}`
			: null;
		const params = segments
			.flat()
			.filter((p) => p.dynamic)
			.map((p) => p.content);
		const route = joinSegments(segments);
		let destination;
		if (typeof to === 'string') {
			destination = to;
		} else {
			destination = to.destination;
		}
		if (URL.canParse(destination) && !/^https?:\/\//.test(destination)) {
			throw new AstroError({
				...UnsupportedExternalRedirect,
				message: UnsupportedExternalRedirect.message(from, destination),
			});
		}
		const redirectRoute = routeMap.get(destination);
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
function isStaticSegment(segment) {
	return segment.every((part) => !part.dynamic && !part.spread);
}
function detectRouteCollision(a, b, _config, logger) {
	if (a.type === 'fallback' || b.type === 'fallback') {
		return;
	}
	if (
		a.route === b.route &&
		a.segments.every(isStaticSegment) &&
		b.segments.every(isStaticSegment)
	) {
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
		return;
	}
	if (a.segments.length !== b.segments.length) {
		return;
	}
	const segmentCount = a.segments.length;
	for (let index = 0; index < segmentCount; index++) {
		const segmentA = a.segments[index];
		const segmentB = b.segments[index];
		if (!isSemanticallyEqualSegment(segmentA, segmentB)) {
			return;
		}
	}
	logger.warn(
		'router',
		`The route "${a.route}" is defined in both "${a.component}" and "${b.component}" using SSR mode. A dynamic SSR route cannot be defined more than once.`,
	);
	logger.warn('router', 'A collision will result in a hard error in following versions of Astro.');
}
async function createRoutesList(params, logger, { dev = false } = {}) {
	const { settings } = params;
	const { config } = settings;
	const routeMap = /* @__PURE__ */ new Map();
	const fileBasedRoutes = createFileBasedRoutes(params, logger);
	for (const route of fileBasedRoutes) {
		routeMap.set(route.route, route);
	}
	const injectedRoutes = createInjectedRoutes(params);
	for (const route of injectedRoutes) {
		routeMap.set(route.route, route);
	}
	const redirectRoutes = createRedirectRoutes(params, routeMap);
	const filteredFiledBasedRoutes = fileBasedRoutes.filter((fileBasedRoute) => {
		const isRedirect = redirectRoutes.findIndex((rd) => rd.route === fileBasedRoute.route);
		return isRedirect < 0;
	});
	const routes = [
		...[...filteredFiledBasedRoutes, ...injectedRoutes, ...redirectRoutes].sort(routeComparator),
	];
	const limit = pLimit(10);
	let promises = [];
	for (const route of routes) {
		promises.push(
			limit(async () => {
				if (route.type !== 'page' && route.type !== 'endpoint' && route.type !== 'redirect') return;
				if (route.type === 'redirect' && !route.redirectRoute) return;
				const localFs = params.fsMod ?? nodeFs;
				const componentUrl = new URL(
					// The destination redirect might be a prerendered
					route.type === 'redirect' && route.redirectRoute
						? route.redirectRoute.component
						: route.component,
					settings.config.root,
				);
				const content = await localFs.promises.readFile(componentUrl, 'utf-8');
				await getRoutePrerenderOption(content, route, settings, logger);
			}),
		);
	}
	await Promise.all(promises);
	for (const [index, higherRoute] of routes.entries()) {
		for (const lowerRoute of routes.slice(index + 1)) {
			detectRouteCollision(higherRoute, lowerRoute, config, logger);
		}
	}
	const i18n = settings.config.i18n;
	if (i18n) {
		const strategy = toRoutingStrategy(i18n.routing, i18n.domains);
		if (strategy === 'pathname-prefix-always') {
			let index = routes.find((route) => route.route === '/');
			if (!index) {
				let relativePath = path.relative(
					fileURLToPath(settings.config.root),
					fileURLToPath(new URL('pages', settings.config.srcDir)),
				);
				throw new AstroError({
					...MissingIndexForInternationalization,
					message: MissingIndexForInternationalization.message(i18n.defaultLocale),
					hint: MissingIndexForInternationalization.hint(relativePath),
				});
			}
		}
		createI18nFallbackRoutes(routes, i18n, config);
	}
	if (dev) {
		ensure404Route({ routes });
	}
	if (dev || settings.buildOutput === 'server') {
		injectImageEndpoint(settings, { routes }, dev ? 'dev' : 'build');
	}
	if (dev || settings.config.adapter) {
		injectServerIslandRoute(settings.config, { routes });
	}
	await runHookRoutesResolved({ routes, settings, logger });
	return {
		routes,
	};
}
function createI18nFallbackRoutes(routes, i18n, config) {
	const strategy = toRoutingStrategy(i18n.routing, i18n.domains);
	const routesByLocale = /* @__PURE__ */ new Map();
	const setRoutes = new Set(routes.filter((route) => route.type === 'page'));
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
			const hasLocaleInRoute = route.route.split('/').includes(locale);
			if (!hasLocaleInRoute) {
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
	if (strategy === 'pathname-prefix-always') {
		const defaultLocaleRoutes = routesByLocale.get(i18n.defaultLocale);
		if (defaultLocaleRoutes) {
			const indexDefaultRoute =
				defaultLocaleRoutes.find(({ route }) => route === '/') ??
				defaultLocaleRoutes.find(({ route }) => route === `/${i18n.defaultLocale}`);
			if (indexDefaultRoute) {
				const pathname = '/';
				const route = '/';
				const segments = removeLeadingForwardSlash(route)
					.split(path.posix.sep)
					.filter(Boolean)
					.map((s) => {
						validateSegment(s);
						return getParts(s, route);
					});
				routes.push({
					...indexDefaultRoute,
					pathname,
					route,
					segments,
					pattern: getPattern(segments, config.base, config.trailingSlash),
					type: 'fallback',
				});
			}
		}
	}
	if (i18n.fallback) {
		const fallback = Object.entries(i18n.fallback);
		if (fallback.length > 0) {
			for (const [fallbackFromLocale, fallbackToLocale] of fallback) {
				let fallbackToRoutes;
				if (fallbackToLocale === i18n.defaultLocale) {
					fallbackToRoutes = routesByLocale.get(i18n.defaultLocale);
				} else {
					fallbackToRoutes = routesByLocale.get(fallbackToLocale);
				}
				const fallbackFromRoutes = routesByLocale.get(fallbackFromLocale);
				if (!fallbackToRoutes) {
					continue;
				}
				for (const fallbackToRoute of fallbackToRoutes) {
					const hasRoute =
						fallbackFromRoutes &&
						fallbackFromRoutes.some((route) => {
							if (fallbackToLocale === i18n.defaultLocale) {
								return (
									route.route === `/${fallbackFromLocale}${fallbackToRoute.route}` ||
									route.route.replace(`/${fallbackFromLocale}`, '') === fallbackToRoute.route
								);
							} else {
								const expectedRoute = replaceOrKeep(
									fallbackToRoute.route,
									fallbackToLocale,
									fallbackFromLocale,
								);
								return route.route === expectedRoute;
							}
						});
					if (!hasRoute) {
						let pathname;
						let route;
						if (
							fallbackToLocale === i18n.defaultLocale &&
							strategy === 'pathname-prefix-other-locales'
						) {
							if (fallbackToRoute.pathname) {
								pathname = `/${fallbackFromLocale}${fallbackToRoute.pathname}`;
							}
							route = `/${fallbackFromLocale}${fallbackToRoute.route}`;
						} else {
							pathname = fallbackToRoute.pathname
								? replaceOrKeep(fallbackToRoute.pathname, fallbackToLocale, fallbackFromLocale)
								: void 0;
							route = replaceOrKeep(fallbackToRoute.route, fallbackToLocale, fallbackFromLocale);
						}
						const segments = removeLeadingForwardSlash(route)
							.split(path.posix.sep)
							.filter(Boolean)
							.map((s) => {
								validateSegment(s);
								return getParts(s, route);
							});
						const index = routes.findIndex((r) => r === fallbackToRoute);
						if (index >= 0) {
							const fallbackRoute = {
								...fallbackToRoute,
								pathname,
								route,
								segments,
								pattern: getPattern(segments, config.base, config.trailingSlash),
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
function resolveInjectedRoute(entrypoint, root, cwd) {
	let resolved;
	try {
		resolved = require2.resolve(entrypoint, { paths: [cwd || fileURLToPath(root)] });
	} catch {
		resolved = fileURLToPath(new URL(entrypoint, root));
	}
	return {
		resolved,
		component: slash(path.relative(cwd || fileURLToPath(root), resolved)),
	};
}
function joinSegments(segments) {
	const arr = segments.map((segment) => {
		return segment.map((rp) => (rp.dynamic ? `[${rp.content}]` : rp.content)).join('');
	});
	return `/${arr.join('/')}`.toLowerCase();
}
function replaceOrKeep(original, from, to) {
	if (original.startsWith(`/${to}/`) || original === `/${to}`) return original;
	return original.replace(`/${from}/`, `/${to}/`).replace(`/${from}`, `/${to}`);
}
export {
	createI18nFallbackRoutes,
	createRoutesFromEntries,
	createRoutesList,
	resolveInjectedRoute,
};
