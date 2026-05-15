import nodeFs from 'node:fs';
import type { AstroSettings, RoutesList } from '../../types/astro.js';
import type { AstroConfig } from '../../types/public/config.js';
import type { RouteData } from '../../types/public/internal.js';
import type { AstroLogger } from '../logger/core.js';
export interface RouteEntry {
	path: string;
	isDir: boolean;
}
type RoutingSettings = Pick<
	AstroSettings,
	'config' | 'injectedRoutes' | 'pageExtensions' | 'buildOutput'
>;
interface CreateRouteManifestParams {
	/** Astro Settings object */
	settings: AstroSettings;
	/** Current working directory */
	cwd?: string;
	/** fs module, for testing */
	fsMod?: typeof nodeFs;
}
export declare function createRoutesFromEntries(
	entries: RouteEntry[],
	settings: RoutingSettings,
	logger: AstroLogger,
	pagesDirRelative?: string,
): RouteData[];
/**
 * Create a full route manifest from filesystem and injected routes.
 */
export declare function createRoutesList(
	params: CreateRouteManifestParams,
	logger: AstroLogger,
	{
		dev,
	}?: {
		dev?: boolean;
	},
): Promise<RoutesList>;
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
export declare function createI18nFallbackRoutes(
	routes: RouteData[],
	i18n: NonNullable<AstroConfig['i18n']>,
	config: Pick<AstroConfig, 'base' | 'trailingSlash'>,
): void;
/**
 * Resolve a route entrypoint to an absolute component path.
 */
export declare function resolveInjectedRoute(
	entrypoint: string,
	root: URL,
	cwd?: string,
): {
	resolved: string;
	component: string;
};
export {};
