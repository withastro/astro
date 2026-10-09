// Imported by the serverless runtime entrypoint, so this module must not
// import anything, especially build-time dependencies of the integration.
// See https://github.com/withastro/astro/issues/18328

/**
 * The edge function calls the node server at /_render,
 * with the original path as the value of this header.
 */
export const ASTRO_PATH_HEADER = 'x-astro-path';
export const ASTRO_PATH_PARAM = 'x_astro_path';

/**
 * ISR functions receive the target path through the `x_astro_path` query
 * parameter instead of a header. Because that parameter travels on the URL, it
 * is accompanied by this token so the entrypoint can confirm the path override
 * came from Astro's own build-time route rewrite rather than from an arbitrary
 * caller. The value is the per-build `middlewareSecret`.
 */
export const ASTRO_PATH_TOKEN_PARAM = 'x_astro_path_token';

/**
 * The edge function calls the node server at /_render,
 * with the locals serialized into this header.
 */
export const ASTRO_LOCALS_HEADER = 'x-astro-locals';
export const ASTRO_MIDDLEWARE_SECRET_HEADER = 'x-astro-middleware-secret';

// Vercel routes the folder names to a path on the deployed website.
// We attempt to avoid interfering by prefixing with an underscore.
export const NODE_PATH = '_render';
