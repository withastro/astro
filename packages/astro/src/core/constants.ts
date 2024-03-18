// process.env.PACKAGE_VERSION is injected when we build and publish the astro package.
export const ASTRO_VERSION = process.env.PACKAGE_VERSION ?? 'development';

export const REROUTE_DIRECTIVE_HEADER = 'X-Astro-Reroute';
export const ROUTE_TYPE_HEADER = 'X-Astro-Route-Type';

export const DEFAULT_404_COMPONENT = 'astro-default-404';

/**
 * A response with one of these status codes will be rewritten
 * with the result of rendering the respective error page.
 */
export const REROUTABLE_STATUS_CODES = [404, 500];

export const clientAddressSymbol = Symbol.for('astro.clientAddress');
export const clientLocalsSymbol = Symbol.for('astro.locals');
export const responseSentSymbol = Symbol.for('astro.responseSent');

// possible extensions for markdown files
export const SUPPORTED_MARKDOWN_FILE_EXTENSIONS = [
	'.markdown',
	'.mdown',
	'.mkdn',
	'.mkd',
	'.mdwn',
	'.md',
] as const;

// The folder name where to find the middleware
export const MIDDLEWARE_PATH_SEGMENT_NAME = 'middleware';
