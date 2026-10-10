// TODO: Should the types here really be public?

import type { ErrorPayload as ViteErrorPayload } from 'vite';
import type { SSRManifestCSP } from '../../core/app/types.js';
import type { AstroCookies } from '../../core/cookies/cookies.js';
import type { Slots } from '../../core/render/slots.js';
import type { AstroComponentInstance, ServerIslandComponent } from '../../runtime/server/index.js';
import type {
	HeadAndContent,
	ThinHead,
} from '../../runtime/server/render/astro/head-and-content.js';
import type { RenderTemplateResult } from '../../runtime/server/render/astro/render-template.js';
import type { Params } from './common.js';
import type { AstroConfig, RedirectConfig } from './config.js';
import type { AstroGlobal } from './context.js';

export type { SSRActions, SSRManifest, SSRManifestCSP } from '../../core/app/types.js';
export type {
	AstroComponentMetadata,
	AsyncRendererComponentFn,
	NamedSSRLoadedRendererValue,
	PropagationHint,
	SSRComponentMetadata,
	SSRElement,
	SSRLoadedRenderer,
	SSRLoadedRendererValue,
	SSRMetadata,
	SSRResult,
} from '@astrojs/vite-plugin-astro';

/**
 * It contains the information about a route
 */
export interface RouteData {
	/**
	 * The current **pattern** of the route. For example:
	 * - `src/pages/index.astro` has a pattern of `/`
	 * - `src/pages/blog/[...slug].astro` has a pattern of `/blog/[...slug]`
	 * - `src/pages/site/[blog]/[...slug].astro` has a pattern of `/site/[blog]/[...slug]`
	 */
	route: string;
	/**
	 *  Source component URL
	 */
	component: string;
	/**
	 * Dynamic and spread route params
	 * ex. "/pages/[lang]/[...slug].astro" will output the params ['lang', '...slug']
	 */
	params: string[];
	/**
	 * Output URL pathname where this route will be served
	 * note: will be undefined for [dynamic] and [...spread] routes
	 */
	pathname?: string;
	/**
	 * The paths of the physical files emitted by this route. When a route **isn't** prerendered, the value is either `undefined` or an empty array.
	 */
	distURL: URL[];
	/**
	 *
	 * regex used for matching an input URL against a requested route
	 * ex. "[fruit]/about.astro" will generate the pattern: /^\/([^/]+?)\/about\/?$/
	 * where pattern.test("banana/about") is "true"
	 *
	 * ## Example
	 *
	 * ```js
	 * if (route.pattern.test('/blog')) {
	 *  // do something
	 * }
	 * ```
	 */
	pattern: RegExp;
	/**
	 * Similar to the "params" field, but with more associated metadata. For example, for `/site/[blog]/[...slug].astro`, the segments are:
	 *
	 * 1. `{ content: 'site', dynamic: false, spread: false }`
	 * 2. `{ content: 'blog', dynamic: true, spread: false }`
	 * 3. `{ content: '...slug', dynamic: true, spread: true }`
	 */
	segments: RoutePart[][];
	/**
	 *
	 * The type of the route. It can be:
	 * - `page`: a route that lives in the file system, usually an Astro component
	 * - `endpoint`: a route that lives in the file system, usually a JS file that exposes endpoints methods
	 * - `redirect`: a route points to another route that lives in the file system
	 * - `fallback`: a route that doesn't exist in the file system that needs to be handled with other means, usually the middleware
	 */
	type: RouteType;
	/**
	 * Whether the route is prerendered or not
	 */
	prerender: boolean;
	/**
	 * The route to redirect to. It holds information regarding the status code and its destination.
	 */
	redirect?: RedirectConfig;
	/**
	 * The {@link RouteData} to redirect to. It's present when `RouteData.type` is `redirect`.
	 */
	redirectRoute?: RouteData;
	/**
	 * A list of {@link RouteData} to fall back to. They are present when `i18n.fallback` has a list of locales.
	 */
	fallbackRoutes: RouteData[];

	/**
	 * If this route is a directory index
	 * For example:
	 * - src/pages/index.astro
	 * - src/pages/blog/index.astro
	 */
	isIndex: boolean;

	/**
	 * Whether the route comes from Astro core, an integration or the user's project
	 */
	origin: 'internal' | 'external' | 'project';
}

/**
 * - page: a route that lives in the file system, usually an Astro component
 * - endpoint: a route that lives in the file system, usually a JS file that exposes endpoints methods
 * - redirect: a route points to another route that lives in the file system
 * - fallback: a route that doesn't exist in the file system that needs to be handled with other means, usually the middleware
 */
export type RouteType = 'page' | 'endpoint' | 'redirect' | 'fallback';

export interface RoutePart {
	content: string;
	dynamic: boolean;
	spread: boolean;
}

declare module '@astrojs/vite-plugin-astro' {
	interface RenderRuntimeTypes {
		factoryReturnValue: RenderTemplateResult | HeadAndContent | ThinHead;
		headPropagator: AstroComponentInstance | ServerIslandComponent;
		slots: Slots;
	}

	interface SSRResultExtensions {
		params: Params;
		response: AstroGlobal['response'];
		request: AstroGlobal['request'];
		actionResult?: ReturnType<AstroGlobal['getActionResult']>;
		/**
		 * Only used for logging
		 */
		pathname: string;
		cookies: AstroCookies | undefined;
		getServerIslandNameMap: () => Promise<Map<string, string>>;
		trailingSlash: AstroConfig['trailingSlash'];
		key: Promise<CryptoKey>;
		/**
		 * `cspDestination`:
		 * - `header`: `<meta>` for static pages, response header for dynamic pages
		 * - `meta`: `<meta>` for all pages
		 * - `adapter`: nothing for static pages (the adapter does this), response header for dynamic pages
		 */
		// NOTE: we use a different type here because at runtime we must provide a value, which is
		// eventually computed from RouteData.prerender
		cspDestination: NonNullable<SSRManifestCSP['cspDestination']>;
		shouldInjectCspMetaTags: boolean;
		cspAlgorithm: SSRManifestCSP['algorithm'];
		directives: SSRManifestCSP['directives'];
		/** @deprecated Use {@linkcode scriptDirective} instead. Holds the `default`-kind `script-src` hashes. */
		scriptHashes: SSRManifestCSP['scriptHashes'];
		/** @deprecated Use {@linkcode scriptDirective} instead. Holds the `default`-kind `script-src` resources. */
		scriptResources: SSRManifestCSP['scriptResources'];
		/** @deprecated Use {@linkcode styleDirective} instead. Holds the `default`-kind `style-src` hashes. */
		styleHashes: SSRManifestCSP['styleHashes'];
		/** @deprecated Use {@linkcode styleDirective} instead. Holds the `default`-kind `style-src` resources. */
		styleResources: SSRManifestCSP['styleResources'];
		/** @deprecated Use {@linkcode scriptDirective}'s `strictDynamic` instead. */
		isStrictDynamic: SSRManifestCSP['isStrictDynamic'];
		scriptDirective: SSRManifestCSP['scriptDirective'];
		styleDirective: SSRManifestCSP['styleDirective'];
		/** Static speculation rules JSON to inject in the head when CSP + clientPrerender are both enabled. */
		speculationRulesContent?: string;
		internalFetchHeaders?: Record<string, string>;
	}
}

export type SSRError = Error & ViteErrorPayload['err'];

// `origin` is set within the hook, but the user doesn't have access to this property. That's why
// we need an intermediary interface
export interface InternalInjectedRoute {
	pattern: string;
	entrypoint: string | URL;
	prerender?: boolean;
	origin: RouteData['origin'];
}

export interface ResolvedInjectedRoute extends InternalInjectedRoute {
	resolvedEntryPoint?: URL;
}
