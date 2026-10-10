/**
 * Types of the Astro component language: compiled component factories, renderers, client
 * directives, the per-render `SSRResult`, and the `Astro` global.
 *
 * `SSRResult` and `AstroGlobal` only declare the members the component language needs. Packages
 * that add request-level data (pages, sessions, i18n, …) add members through declaration merging
 * on `SSRResultExtensions` and `AstroGlobalExtensions`:
 *
 * ```ts
 * declare module '@astrojs/vite-plugin-astro' {
 *   interface AstroGlobalExtensions<Props, Params> {
 *     currentLocale: string | undefined;
 *   }
 * }
 * ```
 *
 * Merged declarations of the generic extension interfaces must repeat the type parameters with the
 * same names and constraints.
 */

/* Client Directives */
type DirectiveHydrate = () => Promise<void>;
type DirectiveLoad = () => Promise<DirectiveHydrate>;

type DirectiveOptions = {
	/**
	 * The component displayName
	 */
	name: string;
	/**
	 * The attribute value provided
	 */
	value: string;
};

export type ClientDirective = (
	load: DirectiveLoad,
	options: DirectiveOptions,
	el: HTMLElement,
) => void;

export interface ClientDirectiveConfig {
	name: string;
	entrypoint: string | URL;
}

export interface AstroClientDirectives {
	'client:load'?: boolean;
	'client:idle'?: IdleRequestOptions | boolean;
	'client:media'?: string;
	'client:visible'?: ClientVisibleOptions | boolean;
	'client:only'?: boolean | string;
}

export type ClientVisibleOptions = Pick<IntersectionObserverInit, 'rootMargin'>;

export interface AstroRenderer {
	/** Name of the renderer. */
	name: string;
	/** Import entrypoint for the client/browser renderer. */
	clientEntrypoint?: string | URL;
	/** Import entrypoint for the server/build/ssr renderer. */
	serverEntrypoint: string | URL;
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
 * Registry of render-runtime class types that the types in this module reference but that are
 * implemented outside this package. The implementing package registers them through declaration
 * merging; unregistered keys resolve to `unknown`.
 *
 * - `factoryReturnValue`: non-`Response` values a component factory returns.
 * - `headPropagator`: components registered in `SSRMetadata.propagators`.
 * - `slots`: the `Astro.slots` implementation cached in `SSRMetadata.slotsByAstro`.
 */
export interface RenderRuntimeTypes {}

type RenderRuntimeType<K extends string> = RenderRuntimeTypes extends { [P in K]: infer T }
	? T
	: unknown;

export type AstroFactoryReturnValue = Response | RenderRuntimeType<'factoryReturnValue'>;

// The callback passed to $$createComponent
export interface AstroComponentFactory {
	(result: any, props: any, slots: any): AstroFactoryReturnValue | Promise<AstroFactoryReturnValue>;
	isAstroComponentFactory?: boolean;
	moduleId?: string | undefined;
	propagation?: PropagationHint;
}

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
	hasRenderedServerIslandRuntime: boolean;
	/**
	 * Used to signal the rendering engine if the current route (page) contains the
	 * <head> element.
	 */
	headInTree: boolean;
	extraHead: string[];
	/**
	 * Used by the rendering engine to store hashes that are **generated** at runtime.
	 * For example, this is used by view transitions
	 */
	extraStyleHashes: string[];
	extraScriptHashes: string[];
	propagators: Set<RenderRuntimeType<'headPropagator'>>;
	/**
	 * `true` when the page being rendered is on a head-propagation path (its
	 * component metadata hint is `in-tree`/`self`). Only then do we await async
	 * slot pre-renders before collecting head content, so that propagating
	 * components hidden behind an `await` in slot markup are discovered in time.
	 * Pages with no propagation keep streaming without paying that cost.
	 */
	routeHasPropagation: boolean;
	/**
	 * Promises from async slot pre-renders that may still need to register
	 * propagating components. Drained by `collectPropagatedHeadParts` before
	 * head content is flushed. Only populated when `routeHasPropagation` is true.
	 */
	pendingSlotEvaluations: Promise<unknown>[];
	slotsByAstro?: WeakMap<object, RenderRuntimeType<'slots'>>;
	/**
	 * Tracks nesting depth of HTML `<template>` elements during rendering.
	 * Scripts rendered inside `<template>` tags should not be deduplicated,
	 * because template content is inert and scripts inside don't execute.
	 */
	templateDepth: number;
}

/**
 * Members of `SSRResult` contributed by packages built on the component language (request data,
 * cookies, CSP, server islands, …). Extend through declaration merging.
 */
export interface SSRResultExtensions {}

/**
 * Per-render state shared by every component rendered for one page.
 */
export interface SSRResult extends SSRResultExtensions {
	/**
	 * Whether the page has failed with a non-recoverable error, or the client disconnected.
	 */
	cancelled: boolean;
	base: string;
	userAssetsBase: string | undefined;
	styles: Set<SSRElement>;
	scripts: Set<SSRElement>;
	links: Set<SSRElement>;
	componentMetadata: Map<string, SSRComponentMetadata>;
	inlinedScripts: Map<string, string>;
	createAstro(props: Record<string, any>, slots: Record<string, any> | null): AstroGlobal;
	resolve: (s: string) => Promise<string>;
	renderers: SSRLoadedRenderer[];
	/**
	 * Map of directive name (e.g. `load`) to the directive script code
	 */
	clientDirectives: Map<string, string>;
	compressHTML: boolean | 'jsx';
	partial: boolean;
	_metadata: SSRMetadata;
}

/**
 * Members of the `Astro` global contributed by packages built on the component language
 * (`Astro.request`, `Astro.session`, `Astro.currentLocale`, …). Extend through declaration merging,
 * repeating both type parameters.
 */
// @ts-expect-error TS6205: the type parameters are used by merged declarations
export interface AstroGlobalExtensions<
	// biome-ignore lint/correctness/noUnusedVariables: used by merged declarations
	Props extends Record<string, any> = Record<string, any>,
	// biome-ignore lint/correctness/noUnusedVariables: used by merged declarations
	Params extends Record<string, string | undefined> = Record<string, string | undefined>,
> {}

/**
 * Astro global available in all contexts in .astro files
 *
 * [Astro reference](https://docs.astro.build/en/reference/api-reference/)
 */
export interface AstroGlobal<
	Props extends Record<string, any> = Record<string, any>,
	Self = AstroComponentFactory,
	Params extends Record<string, string | undefined> = Record<string, string | undefined>,
> extends AstroGlobalExtensions<Props, Params> {
	/**
	 * An object containing any values that have been passed as component attributes.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#props)
	 */
	props: Props;

	/**
	 * Allows a component to be recursively called.
	 *
	 * This is useful when you need to render an Astro component from within
	 * itself. `Astro.self` accepts the same properties as the component itself.
	 *
	 * ## Example
	 *
	 * ```astro
	 * ---
	 * const { items } = Astro.props;
	 * ---
	 * <ul>
	 *   {items.map((item) => (
	 *     <li>
	 *       {Array.isArray(item) ? (
	 *         <Astro.self items={item} />
	 *       ) : (
	 *         item
	 *       )}
	 *     </li>
	 *   ))}
	 * </ul>
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/astro-syntax/#astroself)
	 */
	self: Self;

	/**
	 * An object containing utility functions for modifying an Astro component’s
	 * slotted children.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/astro-syntax/#astroslots)
	 */
	slots: Record<string, true | undefined> & {
		/**
		 * Check whether content for this slot name exists
		 *
		 * @param {string} slotName - The name of the slot to check.
		 * @returns {boolean} Whether the slot exists.
		 *
		 * ## Example
		 *
		 * ```astro
		 * ---
		 * ---
		 * <slot />
		 * {Astro.slots.has('more') && (
		 *   // Do something...
		 * }
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/astro-syntax/#astroslotshas)
		 */
		has(slotName: string): boolean;

		/**
		 * Asynchronously renders the contents of a slot to a string of HTML.
		 *
		 * @param {string} slotName - The name of the slot to render.
		 * @param {any[]} [args] - The additional arguments to pass to the callback.
		 * @returns {Promise<string>} The rendered slot as HTML string.
		 *
		 * ## Examples
		 *
		 * ```astro
		 * ---
		 * let html: string = '';
		 * if (Astro.slots.has('default')) {
		 *   html = await Astro.slots.render('default')
		 * }
		 * ---
		 * <Fragment set:html={html} />
		 * ```
		 *
		 * A second parameter can be used to pass arguments to a slotted callback
		 *
		 * ```astro
		 * ---
		 * html = await Astro.slots.render('default', ["Hello", "World"])
		 * ---
		 * ```
		 * Each item in the array will be passed as an argument that you can use like so:
		 * ```astro
		 * <Component>
		 *		{(hello, world) => <div>{hello}, {world}!</div>}
		 * </Component>
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/astro-syntax/#astroslotsrender)
		 */
		render(slotName: string, args?: any[]): Promise<string>;
	};
}
