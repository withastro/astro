const ASTRO_VERSION = '6.3.3';
const ASTRO_GENERATOR = `Astro v${ASTRO_VERSION}`;
const REROUTE_DIRECTIVE_HEADER = 'X-Astro-Reroute';
const REWRITE_DIRECTIVE_HEADER_KEY = 'X-Astro-Rewrite';
const REWRITE_DIRECTIVE_HEADER_VALUE = 'yes';
const NOOP_MIDDLEWARE_HEADER = 'X-Astro-Noop';
const ROUTE_TYPE_HEADER = 'X-Astro-Route-Type';
const INTERNAL_RESPONSE_HEADERS = [
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
	NOOP_MIDDLEWARE_HEADER,
	ROUTE_TYPE_HEADER,
];
const ASTRO_ERROR_HEADER = 'X-Astro-Error';
const DEFAULT_404_COMPONENT = 'astro-default-404.astro';
const REDIRECT_STATUS_CODES = [301, 302, 303, 307, 308, 300, 304];
const REROUTABLE_STATUS_CODES = [404, 500];
const clientAddressSymbol = /* @__PURE__ */ Symbol.for('astro.clientAddress');
const clientLocalsSymbol = /* @__PURE__ */ Symbol.for('astro.locals');
const originPathnameSymbol = /* @__PURE__ */ Symbol.for('astro.originPathname');
const pipelineSymbol = /* @__PURE__ */ Symbol.for('astro.pipeline');
const fetchStateSymbol = /* @__PURE__ */ Symbol.for('astro.fetchState');
const appSymbol = /* @__PURE__ */ Symbol.for('astro.app');
const devPrerenderMiddlewareSymbol = /* @__PURE__ */ Symbol.for('astro.devPrerenderMiddleware');
const nodeRequestAbortControllerCleanupSymbol = /* @__PURE__ */ Symbol.for(
	'astro.nodeRequestAbortControllerCleanup',
);
const responseSentSymbol = /* @__PURE__ */ Symbol.for('astro.responseSent');
const SUPPORTED_MARKDOWN_FILE_EXTENSIONS = ['.markdown', '.mdown', '.mkdn', '.mkd', '.mdwn', '.md'];
const MIDDLEWARE_PATH_SEGMENT_NAME = 'middleware';
const ASTRO_VITE_ENVIRONMENT_NAMES = {
	// It maps to the classic `ssr` Vite environment
	ssr: 'ssr',
	// It maps to the classic `client` Vite environment
	client: 'client',
	// Use this environment when `ssr` isn't a runnable dev environment, and you need
	// a runnable dev environment. A runnable dev environment allows you, for example,
	// to load a module via `runner.import`.
	//
	// This environment should be used only for dev, not production.
	astro: 'astro',
	// Environment used during the build for rendering static pages.
	// If your plugin runs in `ASTRO_VITE_ENVIRONMENT_NAMES.ssr`, you might
	// want to add `ASTRO_VITE_ENVIRONMENT_NAMES.prerender` too
	prerender: 'prerender',
};
export {
	ASTRO_ERROR_HEADER,
	ASTRO_GENERATOR,
	ASTRO_VERSION,
	ASTRO_VITE_ENVIRONMENT_NAMES,
	DEFAULT_404_COMPONENT,
	INTERNAL_RESPONSE_HEADERS,
	MIDDLEWARE_PATH_SEGMENT_NAME,
	NOOP_MIDDLEWARE_HEADER,
	REDIRECT_STATUS_CODES,
	REROUTABLE_STATUS_CODES,
	REROUTE_DIRECTIVE_HEADER,
	REWRITE_DIRECTIVE_HEADER_KEY,
	REWRITE_DIRECTIVE_HEADER_VALUE,
	ROUTE_TYPE_HEADER,
	SUPPORTED_MARKDOWN_FILE_EXTENSIONS,
	appSymbol,
	clientAddressSymbol,
	clientLocalsSymbol,
	devPrerenderMiddlewareSymbol,
	fetchStateSymbol,
	nodeRequestAbortControllerCleanupSymbol,
	originPathnameSymbol,
	pipelineSymbol,
	responseSentSymbol,
};
