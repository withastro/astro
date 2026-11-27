import type nodeFs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { removeLeadingForwardSlash } from '@astrojs/internal-helpers/path';
import type { InjectedRoute, RouteTransform } from '@astrojs/vite-plugin-router';
import {
	createRoutesFromEntries as createRouterRoutesFromEntries,
	createRoutesList as createRouterRoutesList,
	type OriginInjectedRoute,
	type RouteEntry,
} from '@astrojs/vite-plugin-router/_internal/core/routing/create-manifest.js';
import { getParts } from '@astrojs/vite-plugin-router/_internal/core/routing/parts.js';
import { getPattern } from '@astrojs/vite-plugin-router/_internal/core/routing/pattern.js';
import { validateSegment } from '@astrojs/vite-plugin-router/_internal/core/routing/segment.js';
import { isRoute3xx } from '@astrojs/runtime/_internal/core/routing/internal/route-errors.js';
import { MissingIndexForInternationalization } from '@astrojs/runtime/_internal/core/errors/errors-data.js';
import { AstroError } from '@astrojs/runtime/_internal/core/errors/index.js';
import type { AstroLogger } from '@astrojs/vite-plugin-router/_internal/core/logger/core.js';
import { getImageEndpointRoute } from '../../assets/endpoint/config.js';
import { runHookRouteSetup, runHookRoutesResolved } from '../../integrations/hooks.js';
import type { AstroSettings, RoutesList } from '../../types/astro.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';
import { toRoutingStrategy } from '../app/entrypoints/index.js';
import { toRouterConfig } from '../router-config.js';

const require = createRequire(import.meta.url);

export { resolveInjectedRoute } from '@astrojs/vite-plugin-router/_internal/core/routing/create-manifest.js';
export type { RouteEntry };

type RoutingSettings = Pick<
	AstroSettings,
	'config' | 'injectedRoutes' | 'pageExtensions' | 'buildOutput'
>;

interface CreateRouteManifestParams {
	/** Astro Settings object */
	settings: AstroSettings;
	/**
	 * Routes registered with `api.astroRouter.injectRoute()`, added after
	 * `settings.injectedRoutes` with `origin: 'external'`.
	 */
	injectedRoutes?: readonly InjectedRoute[];
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
	/** Current working directory */
	cwd?: string;
	/** fs module, for testing */
	fsMod?: typeof nodeFs;
}

export function createRoutesFromEntries(
	entries: RouteEntry[],
	settings: RoutingSettings,
	logger: AstroLogger,
	pagesDirRelative = 'src/pages',
): RouteData[] {
	const { config } = settings;
	return createRouterRoutesFromEntries(
		entries,
		{
			root: config.root,
			srcDir: config.srcDir,
			base: config.base,
			trailingSlash: config.trailingSlash,
			output: config.output,
			pageExtensions: settings.pageExtensions,
		},
		logger,
		pagesDirRelative,
	);
}

/** Checks the i18n index page and adds the i18n fallback routes. */
function createI18nRouteTransform(config: AstroConfig): RouteTransform | undefined {
	const { i18n } = config;
	if (!i18n) return undefined;
	return (routes) => {
		const strategy = toRoutingStrategy(i18n.routing, i18n.domains);
		// First we check if the user doesn't have an index page.
		if (strategy === 'pathname-prefix-always') {
			const index = routes.find((route) => route.route === '/');
			if (!index) {
				const relativePath = path.relative(
					fileURLToPath(config.root),
					fileURLToPath(new URL('pages', config.srcDir)),
				);
				throw new AstroError({
					...MissingIndexForInternationalization,
					message: MissingIndexForInternationalization.message(i18n.defaultLocale),
					hint: MissingIndexForInternationalization.hint(relativePath),
				});
			}
		}

		createI18nFallbackRoutes(routes, i18n, config);
	};
}

/**
 * Create a full route manifest from filesystem and injected routes, with Astro's integration
 * routes, i18n fallback routes and image endpoint, and run `astro:routes:resolved`.
 */
export async function createRoutesList(
	params: CreateRouteManifestParams,
	logger: AstroLogger,
	{
		dev = false,
	}: {
		dev?: boolean;
	} = {},
): Promise<RoutesList> {
	const { settings } = params;
	const i18nTransform = createI18nRouteTransform(settings.config);
	const injectedRoutes: OriginInjectedRoute[] = [
		...settings.injectedRoutes,
		...(params.injectedRoutes ?? []),
	].map(resolveAstroEntrypoint);
	const { routes, buildOutput } = await createRouterRoutesList(
		{
			config: toRouterConfig(settings),
			injectedRoutes,
			internalRoutes: [
				...(params.internalRoutes ?? []),
				getImageEndpointRoute(settings, dev ? 'dev' : 'build'),
			].map(resolveAstroEntrypoint),
			routeTransforms: [
				...(i18nTransform ? [i18nTransform] : []),
				...(params.routeTransforms ?? []),
			],
			onRouteSetup: (route) => runHookRouteSetup({ route, settings, logger }),
			// If an adapter is added, we unconditionally inject the server islands route.
			// Ideally we would only inject the server islands route if server islands are used in the
			// project. Unfortunately, there is a "circular dependency": to know if server islands are
			// used, we need to run the build but the build relies on the routes manifest.
			serverIslands: Boolean(settings.config.adapter),
			cwd: params.cwd,
			fsMod: params.fsMod,
		},
		logger,
		{ dev },
	);
	if (buildOutput === 'server') settings.buildOutput = 'server';
	await runHookRoutesResolved({ routes, settings, logger });
	return { routes };
}

/**
 * Resolves `astro/*` entrypoints (the actions RPC route, the image endpoint) from this package.
 * `@astrojs/vite-plugin-router` resolves entrypoints from the project, which may not have `astro` in
 * its `node_modules` (the fixtures of this repository).
 */
function resolveAstroEntrypoint<T extends InjectedRoute>(route: T): T {
	if (typeof route.entrypoint !== 'string' || !route.entrypoint.startsWith('astro/')) return route;
	return { ...route, entrypoint: require.resolve(route.entrypoint) };
}

/**
 * Generates i18n fallback routes and attaches them to their source routes.
 *
 * For each locale that has a fallback configured (e.g. `{ es: 'en' }`), this
 * function inspects the existing route list and creates `type: 'fallback'`
 * entries for any paths that the source locale does not already have.  The
 * fallback routes are pushed onto `route.fallbackRoutes` of their source route
 * so that the build pipeline can serve the fallback content.
 *
 * @param routes  The full route list — mutated in-place.
 * @param i18n    The resolved `config.i18n` object.
 * @param config  The resolved Astro config (needs `base` and `trailingSlash`).
 */
export function createI18nFallbackRoutes(
	routes: RouteData[],
	i18n: NonNullable<AstroConfig['i18n']>,
	config: Pick<AstroConfig, 'base' | 'trailingSlash'>,
): void {
	const strategy = toRoutingStrategy(i18n.routing, i18n.domains);

	// Group page routes by locale
	const routesByLocale = new Map<string, RouteData[]>();
	const setRoutes = new Set(
		routes.filter((route) => route.type === 'page' && !isRoute3xx(route.route)),
	);

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
					.map((s: string) => {
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
						let pathname: string | undefined;
						let route: string;
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
								: undefined;
							route = replaceOrKeep(fallbackToRoute.route, fallbackToLocale, fallbackFromLocale);
						}
						const segments = removeLeadingForwardSlash(route)
							.split(path.posix.sep)
							.filter(Boolean)
							.map((s: string) => {
								validateSegment(s);
								return getParts(s, route);
							});
						const index = routes.findIndex((r) => r === fallbackToRoute);
						if (index >= 0) {
							const fallbackRoute: RouteData = {
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

/**
 * Swaps the first `from` locale segment of a route for `to`. Routes that already carry the
 * `to` locale, and routes with no `from` segment, are returned unchanged. Matching is done on
 * whole segments — the same way routes are grouped by locale above — so a locale code that is
 * merely a prefix of another segment (`/en/enterprise`) is left alone.
 */
function replaceOrKeep(original: string, from: string, to: string): string {
	if (original.startsWith(`/${to}/`) || original === `/${to}`) return original;
	const segments = original.split('/');
	const index = segments.indexOf(from);
	if (index === -1) return original;
	segments[index] = to;
	return segments.join('/');
}
