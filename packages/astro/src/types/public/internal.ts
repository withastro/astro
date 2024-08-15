// TODO: Should the types here really be public?

import type { AstroCookies } from '../../core/cookies/cookies.js';
import type { AstroComponentInstance } from '../../runtime/server/index.js';
import type { Params } from './common.js';
import type { AstroConfig, RedirectConfig } from './config.js';
import type { AstroGlobal, AstroGlobalPartial } from './context.js';
import type { AstroRenderer } from './integrations.js';
import type { ErrorPayload as ViteErrorPayload } from 'vite';

export type { SSRManifest } from '../../core/app/types.js';

export interface NamedSSRLoadedRendererValue extends SSRLoadedRendererValue {
	name: string;
}

export interface SSRLoadedRendererValue {
	name?: string;
	check: AsyncRendererComponentFn<boolean>;
	renderToStaticMarkup: AsyncRendererComponentFn<{
		html: string;
		attrs?: Record<string, string>;
	}>;
	supportsAstroStaticSlot?: boolean;
	/**
	 * If provided, Astro will call this function and inject the returned
	 * script in the HTML before the first component handled by this renderer.
	 *
	 * This feature is needed by some renderers (in particular, by Solid). The
	 * Solid official hydration script sets up a page-level data structure.
	 * It is mainly used to transfer data between the server side render phase
	 * and the browser application state. Solid Components rendered later in
	 * the HTML may inject tiny scripts into the HTML that call into this
	 * page-level data structure.
	 */
	renderHydrationScript?: () => string;
}

export interface RouteData {
	route: string;
	component: string;
	generate: (data?: any) => string;
	params: string[];
	pathname?: string;
	// expose the real path name on SSG
	distURL?: URL;
	pattern: RegExp;
	segments: RoutePart[][];
	type: RouteType;
	prerender: boolean;
	redirect?: RedirectConfig;
	redirectRoute?: RouteData;
	fallbackRoutes: RouteData[];
	isIndex: boolean;
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

export interface AstroComponentMetadata {
	displayName: string;
	hydrate?: 'load' | 'idle' | 'visible' | 'media' | 'only';
	hydrateArgs?: any;
	componentUrl?: string;
	componentExport?: { value: string; namespace?: boolean };
	astroStaticSlot: true;
}

export type AsyncRendererComponentFn<U> = (
	Component: any,
	props: any,
	slots: Record<string, string>,
	metadata?: AstroComponentMetadata,
) => Promise<U>;

export interface NamedSSRLoadedRendererValue extends SSRLoadedRendererValue {
	name: string;
}

export interface SSRLoadedRendererValue {
	name?: string;
	check: AsyncRendererComponentFn<boolean>;
	renderToStaticMarkup: AsyncRendererComponentFn<{
		html: string;
		attrs?: Record<string, string>;
	}>;
	supportsAstroStaticSlot?: boolean;
	/**
	 * If provided, Astro will call this function and inject the returned
	 * script in the HTML before the first component handled by this renderer.
	 *
	 * This feature is needed by some renderers (in particular, by Solid). The
	 * Solid official hydration script sets up a page-level data structure.
	 * It is mainly used to transfer data between the server side render phase
	 * and the browser application state. Solid Components rendered later in
	 * the HTML may inject tiny scripts into the HTML that call into this
	 * page-level data structure.
	 */
	renderHydrationScript?: () => string;
}

export interface SSRLoadedRenderer extends Pick<AstroRenderer, 'name' | 'clientEntrypoint'> {
	ssr: SSRLoadedRendererValue;
}

export interface SSRElement {
	props: Record<string, any>;
	children: string;
}

export interface SSRResult {
	/**
	 * Whether the page has failed with a non-recoverable error, or the client disconnected.
	 */
	cancelled: boolean;
	base: string;
	styles: Set<SSRElement>;
	scripts: Set<SSRElement>;
	links: Set<SSRElement>;
	componentMetadata: Map<string, SSRComponentMetadata>;
	inlinedScripts: Map<string, string>;
	createAstro(
		Astro: AstroGlobalPartial,
		props: Record<string, any>,
		slots: Record<string, any> | null,
	): AstroGlobal;
	params: Params;
	resolve: (s: string) => Promise<string>;
	response: AstroGlobal['response'];
	request: AstroGlobal['request'];
	actionResult?: ReturnType<AstroGlobal['getActionResult']>;
	renderers: SSRLoadedRenderer[];
	/**
	 * Map of directive name (e.g. `load`) to the directive script code
	 */
	clientDirectives: Map<string, string>;
	compressHTML: boolean;
	partial: boolean;
	/**
	 * Only used for logging
	 */
	pathname: string;
	cookies: AstroCookies | undefined;
	serverIslandNameMap: Map<string, string>;
	trailingSlash: AstroConfig['trailingSlash'];
	key: Promise<CryptoKey>;
	_metadata: SSRMetadata;
}

/**
 * A hint on whether the Astro runtime needs to wait on a component to render head
 * content. The meanings:
 *
 * - __none__ (default) The component does not propagation head content.
 * - __self__ The component appends head content.
 * - __in-tree__ Another component within this component's dependency tree appends head content.
 *
 * These are used within the runtime to know whether or not a component should be waited on.
 */
export type PropagationHint = 'none' | 'self' | 'in-tree';

export type SSRComponentMetadata = {
	propagation: PropagationHint;
	containsHead: boolean;
};

/**
 * Ephemeral and mutable state during rendering that doesn't rely
 * on external configuration
 */
export interface SSRMetadata {
	hasHydrationScript: boolean;
	/**
	 * Names of renderers that have injected their hydration scripts
	 * into the current page. For example, Solid SSR needs a hydration
	 * script in the page HTML before the first Solid component.
	 */
	rendererSpecificHydrationScripts: Set<string>;
	/**
	 * Used by `renderScript` to track script ids that have been rendered,
	 * so we only render each once.
	 */
	renderedScripts: Set<string>;
	hasDirectives: Set<string>;
	hasRenderedHead: boolean;
	headInTree: boolean;
	extraHead: string[];
	propagators: Set<AstroComponentInstance>;
}

export type SSRError = Error & ViteErrorPayload['err'];
