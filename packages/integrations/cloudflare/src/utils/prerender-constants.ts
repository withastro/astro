/**
 * Constants for prerender endpoints used by Cloudflare adapter
 */

/** Internal endpoint for fetching all static paths during prerendering */
export const STATIC_PATHS_ENDPOINT = '/__astro_static_paths';

/** Internal endpoint for rendering a specific page during prerendering */
export const PRERENDER_ENDPOINT = '/__astro_prerender';

/**
 * Internal endpoint for transforming a single image with the IMAGES binding during
 * `cloudflare-binding` builds. Takes the same query parameters as `/_image` and streams
 * the optimized bytes back, one image per request.
 */
export const IMAGE_TRANSFORM_ENDPOINT = '/__astro_image_transform';

/** Where the prerenderer publishes its URL for the `cloudflare-binding` build image service. */
export const PRERENDER_SERVER_URL_KEY = Symbol.for('@astrojs/cloudflare:prerender-server-url');
