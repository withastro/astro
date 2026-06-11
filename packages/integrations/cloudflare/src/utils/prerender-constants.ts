/**
 * Constants for prerender endpoints used by Cloudflare adapter
 */

/** Internal endpoint for fetching all static paths during prerendering */
export const STATIC_PATHS_ENDPOINT = '/__astro_static_paths';

/** Internal endpoint for rendering a specific page during prerendering */
export const PRERENDER_ENDPOINT = '/__astro_prerender';

/** Internal endpoint for fetching static images collected in workerd during `compile` builds */
export const STATIC_IMAGES_ENDPOINT = '/__astro_static_images';

/**
 * Response header set by the workerd prerender endpoint when rendering a page threw.
 * Status codes alone cannot signal failure because pages may legitimately render
 * with non-2xx statuses (e.g. custom 404/500 pages).
 */
export const PRERENDER_ERROR_HEADER = 'x-astro-prerender-error';
