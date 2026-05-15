import type { RouteData } from '../../types/public/internal.js';
/**
 * Comparator for sorting routes in resolution order.
 *
 * The routes are sorted in by the following rules in order, following the first rule that
 * applies:
 * - More specific routes are sorted before less specific routes. Here, "specific" means
 *   the number of segments in the route, so a parent route is always sorted after its children.
 *   For example, `/foo/bar` is sorted before `/foo`.
 *   Index routes, originating from a file named `index.astro`, are considered to have one more
 *   segment than the URL they represent.
 * - Static routes are sorted before dynamic routes.
 *   For example, `/foo/bar` is sorted before `/foo/[bar]`.
 * - Dynamic routes with single parameters are sorted before dynamic routes with rest parameters.
 *   For example, `/foo/[bar]` is sorted before `/foo/[...bar]`.
 * - Prerendered routes are sorted before non-prerendered routes.
 * - Endpoints are sorted before pages.
 *   For example, a file `/foo.ts` is sorted before `/bar.astro`.
 * - If both routes are equal regarding all previous conditions, they are sorted alphabetically.
 *   For example, `/bar` is sorted before `/foo`.
 *   The definition of "alphabetically" is dependent on the default locale of the running system.
 */
export declare function routeComparator(a: RouteData, b: RouteData): number;
