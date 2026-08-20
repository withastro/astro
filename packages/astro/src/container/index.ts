import { getDefaultClientDirectives } from '../core/client-directive/default.js';
import { ASTRO_CONFIG_DEFAULTS } from '../core/config/schemas/defaults.js';
import { createKey } from '../core/encryption.js';
import { FetchState } from '../core/fetch/fetch-state.js';
import { handleMiddleware } from '../core/middleware/astro-middleware.js';
import { NOOP_MIDDLEWARE_FN } from '../core/middleware/noop-middleware.js';
import { handlePages } from '../core/pages/handler.js';
import { removeLeadingForwardSlash } from '../core/path.js';

import { getParts } from '../core/routing/parts.js';
import { getPattern } from '../core/routing/pattern.js';
import { validateSegment } from '../core/routing/segment.js';
import type { AstroComponentFactory } from '../runtime/server/index.js';
import { SlotString } from '../runtime/server/render/slot.js';
import type { ComponentInstance } from '../types/astro.js';
import type { AstroMiddlewareInstance, MiddlewareHandler, Props } from '../types/public/common.js';
import type { AstroUserConfig } from '../types/public/config.js';
import type {
	NamedSSRLoadedRendererValue,
	RouteData,
	RouteType,
	SSRLoadedRenderer,
	SSRLoadedRendererValue,
	SSRManifest,
	SSRResult,
} from '../types/public/internal.js';
import type { SinglePageBuiltModule } from '../core/build/types.js';
import { createContainerEnvironment } from './environment.js';
import { setEnvironment } from '../core/environment/index.js';
import { createConsoleLogger } from '../core/logger/impls/console.js';
import { setLogger } from '../core/logger/manifest-logger.js';
import { peekMiddleware } from '../core/middleware/load.js';
import { getRouteTable } from '../core/routing/route-table.js';

/**
 * Public type, used for integrations to define a renderer for the container API
 * @deprecated Use `AstroRenderer` instead.
 */
export type ContainerRenderer = {
	/**
	 * The name of the renderer.
	 */
	name: string;
	/**
	 * The entrypoint that is used to render a component on the server
	 */
	serverEntrypoint: string;
};

/**
 * Options to be passed when rendering a route
 */
export type ContainerRenderOptions = {
	/**
	 * If your component renders slots, that's where you want to fill the slots.
	 * A single slot should have the `default` field:
	 *
	 * ## Examples
	 *
	 * **Default slot**
	 *
	 * ```js
	 * container.renderToString(Component, { slots: { default: "Some value"}});
	 * ```
	 *
	 * **Named slots**
	 *
	 * ```js
	 * container.renderToString(Component, { slots: { "foo": "Some value", "bar": "Lorem Ipsum" }});
	 * ```
	 */
	slots?: Record<string, any>;
	/**
	 * The request is used to understand which path/URL the component is about to render.
	 *
	 * Use this option in case your component or middleware needs to read information like `Astro.url` or `Astro.request`.
	 */
	request?: Request;
	/**
	 * Useful for dynamic routes. If your component is something like `src/pages/blog/[id]/[...slug]`, you'll want to provide:
	 * ```js
	 * container.renderToString(Component, { params: ["id", "...slug"] });
	 * ```
	 */
	params?: Record<string, string | undefined>;
	/**
	 * Useful if your component needs to access some locals without the use of middleware.
	 * ```js
	 * container.renderToString(Component, { locals: { getSomeValue() {} } });
	 * ```
	 */
	locals?: App.Locals;
	/**
	 * Useful in case you're attempting to render an endpoint:
	 * ```js
	 * container.renderToString(Endpoint, { routeType: "endpoint" });
	 * ```
	 */
	routeType?: RouteType;

	/**
	 * Allows passing `Astro.props` to an Astro component:
	 *
	 * ```js
	 * container.renderToString(Endpoint, { props: { "lorem": "ipsum" } });
	 * ```
	 */
	props?: Props;

	/**
	 * When `false`, it forces the component to render as if it were a full-fledged page.
	 *
	 * By default, the container API renders components as [partials](https://docs.astro.build/en/basics/astro-pages/#page-partials).
	 *
	 */
	partial?: boolean;
};

export type AddServerRenderer =
	| {
			renderer: NamedSSRLoadedRendererValue;
	  }
	| {
			renderer: SSRLoadedRendererValue;
			name: string;
	  };

export type AddClientRenderer = {
	name: string;
	entrypoint: string;
};

function createManifest(
	manifest?: AstroContainerManifest,
	renderers?: SSRLoadedRenderer[],
	middleware?: MiddlewareHandler,
	site?: string,
): SSRManifest {
	function middlewareInstance(): AstroMiddlewareInstance {
		return {
			onRequest: middleware ?? NOOP_MIDDLEWARE_FN,
		};
	}
	// Use import.meta.url as root when available (Node.js), otherwise fall back
	// to a synthetic URL so the container works in non-Node environments (e.g. workerd).
	let root: URL;
	try {
		root = new URL(import.meta.url);
	} catch {
		root = new URL('file:///container/');
	}
	return {
		rootDir: root,
		srcDir: manifest?.srcDir ?? new URL(ASTRO_CONFIG_DEFAULTS.srcDir, root),
		buildClientDir: manifest?.buildClientDir ?? new URL(ASTRO_CONFIG_DEFAULTS.build.client, root),
		buildServerDir: manifest?.buildServerDir ?? new URL(ASTRO_CONFIG_DEFAULTS.build.server, root),
		publicDir: manifest?.publicDir ?? new URL(ASTRO_CONFIG_DEFAULTS.publicDir, root),
		outDir: manifest?.outDir ?? new URL(ASTRO_CONFIG_DEFAULTS.outDir, root),
		cacheDir: manifest?.cacheDir ?? new URL(ASTRO_CONFIG_DEFAULTS.cacheDir, root),
		trailingSlash: manifest?.trailingSlash ?? ASTRO_CONFIG_DEFAULTS.trailingSlash,
		buildFormat: manifest?.buildFormat ?? ASTRO_CONFIG_DEFAULTS.build.format,
		compressHTML: manifest?.compressHTML ?? ASTRO_CONFIG_DEFAULTS.compressHTML,
		assetsDir: manifest?.assetsDir ?? ASTRO_CONFIG_DEFAULTS.build.assets,
		serverLike: manifest?.serverLike ?? true,
		middlewareMode: manifest?.middlewareMode ?? 'classic',
		assets: manifest?.assets ?? new Set(),
		assetsPrefix: manifest?.assetsPrefix ?? undefined,
		entryModules: manifest?.entryModules ?? {},
		routes: manifest?.routes ?? [],
		adapterName: '',
		clientDirectives: manifest?.clientDirectives ?? getDefaultClientDirectives(),
		renderers: renderers ?? manifest?.renderers ?? [],
		base: manifest?.base ?? ASTRO_CONFIG_DEFAULTS.base,
		userAssetsBase: manifest?.userAssetsBase ?? '',
		componentMetadata: manifest?.componentMetadata ?? new Map(),
		inlinedScripts: manifest?.inlinedScripts ?? new Map(),
		i18n: manifest?.i18n,
		site: site ?? manifest?.site,
		checkOrigin: false,
		allowedDomains: manifest?.allowedDomains ?? [],
		actionBodySizeLimit: 1024 * 1024,
		serverIslandBodySizeLimit: 1024 * 1024,
		middleware: manifest?.middleware ?? middlewareInstance,
		key: createKey(),
		csp: manifest?.csp,
		image: manifest?.image ?? {},
		shouldInjectCspMetaTags: false,
		devToolbar: {
			enabled: false,
			latestAstroVersion: undefined,
			debugInfoOutput: '',
			placement: undefined,
		},
		logLevel: 'silent',
	};
}

export type AstroContainerUserConfig = Omit<AstroUserConfig, 'integrations' | 'adapter'>;

/**
 * Options that are used for the entire lifecycle of the current instance of the container.
 */
export type AstroContainerOptions = {
	/**
	 * @default false
	 *
	 * @description
	 *
	 * Enables streaming during rendering
	 *
	 * ## Example
	 *
	 * ```js
	 * const container = await AstroContainer.create({
	 * 	streaming: true
	 * });
	 * ```
	 */
	streaming?: boolean;
	/**
	 * @default []
	 * @description
	 *
	 * List or renderers to use when rendering components. Usually, you want to pass these in an SSR context.
	 */
	renderers?: SSRLoadedRenderer[];
	/**
	 * @default {}
	 * @description
	 *
	 * A subset of the astro configuration object.
	 *
	 * ## Example
	 *
	 * ```js
	 * const container = await AstroContainer.create({
	 * 	astroConfig: {
	 * 		trailingSlash: "never"
	 * 	}
	 * });
	 * ```
	 */
	astroConfig?: AstroContainerUserConfig;

	// TODO: document out of experimental
	resolve?: SSRResult['resolve'];

	/**
	 * @default {}
	 * @description
	 *
	 * The raw manifest from the build output.
	 */
	manifest?: SSRManifest;
};

type AstroContainerManifest = Pick<
	SSRManifest,
	| 'middleware'
	| 'clientDirectives'
	| 'inlinedScripts'
	| 'componentMetadata'
	| 'renderers'
	| 'assetsPrefix'
	| 'base'
	| 'userAssetsBase'
	| 'routes'
	| 'assets'
	| 'entryModules'
	| 'compressHTML'
	| 'trailingSlash'
	| 'buildFormat'
	| 'i18n'
	| 'srcDir'
	| 'buildClientDir'
	| 'buildServerDir'
	| 'publicDir'
	| 'outDir'
	| 'cacheDir'
	| 'csp'
	| 'allowedDomains'
	| 'serverLike'
	| 'middlewareMode'
	| 'assetsDir'
	| 'image'
	| 'site'
>;

type AstroContainerConstructor = {
	streaming?: boolean;
	renderers?: SSRLoadedRenderer[];
	manifest?: AstroContainerManifest;
	resolve?: SSRResult['resolve'];
	site?: string;
};

export class experimental_AstroContainer {
	/**
	 * The container's fabricated manifest — the source of truth all the
	 * functional-core accessors key off. The container never touches the
	 * ambient manifest, so multiple containers in one process stay isolated.
	 */
	#manifest: SSRManifest;

	/**
	 * The route → module interner, shared between the environment record
	 * (lookups) and the `insertRoute` writes below.
	 */
	#interner: WeakMap<RouteData, SinglePageBuiltModule>;

	/**
	 * Internally used to check if the container was created with a manifest.
	 * @private
	 */
	#withManifest = false;

	private constructor({
		streaming = false,
		manifest,
		renderers,
		resolve,
		site,
	}: AstroContainerConstructor) {
		const ssrManifest = createManifest(manifest, renderers, undefined, site);
		const containerRenderers = renderers ?? manifest?.renderers ?? [];
		const containerResolve = async (specifier: string): Promise<string> => {
			if (this.#withManifest) {
				return this.#containerResolve(specifier, ssrManifest);
			} else if (resolve) {
				return resolve(specifier);
			}
			return specifier;
		};
		const interner = new WeakMap<RouteData, SinglePageBuiltModule>();
		setLogger(ssrManifest, createConsoleLogger({ level: 'error' }));
		setEnvironment(
			ssrManifest,
			createContainerEnvironment({
				interner,
				resolve: containerResolve,
				renderers: containerRenderers,
				streaming,
			}),
		);
		getRouteTable(ssrManifest);
		this.#manifest = ssrManifest;
		this.#interner = interner;
	}

	async #containerResolve(specifier: string, manifest: SSRManifest): Promise<string> {
		const found = manifest.entryModules[specifier];
		if (found) {
			return new URL(found, manifest.buildClientDir).toString();
		}
		return found;
	}

	/**
	 * Creates a new instance of a container.
	 *
	 * @param {AstroContainerOptions=} containerOptions
	 */
	public static async create(
		containerOptions: AstroContainerOptions = {},
	): Promise<experimental_AstroContainer> {
		const { streaming = false, manifest, renderers = [], resolve, astroConfig } = containerOptions;
		return new experimental_AstroContainer({
			streaming,
			manifest,
			renderers,
			resolve,
			site: astroConfig?.site ?? manifest?.site,
		});
	}

	/**
	 * Use this function to manually add a **server** renderer to the container.
	 *
	 * This function is preferred when you require to use the container with a renderer in environments such as on-demand pages.
	 *
	 * ## Example
	 *
	 * ```js
	 * import reactRenderer from "@astrojs/react/server.js";
	 * import vueRenderer from "@astrojs/vue/server.js";
	 * import customRenderer from "../renderer/customRenderer.js";
	 * import { experimental_AstroContainer as AstroContainer } from "astro/container"
	 *
	 * const container = await AstroContainer.create();
	 * container.addServerRenderer(reactRenderer);
	 * container.addServerRenderer(vueRenderer);
	 * container.addServerRenderer("customRenderer", customRenderer);
	 * ```
	 *
	 * @param options {object}
	 * @param options.name The name of the renderer. The name **isn't** arbitrary, and it should match the name of the package.
	 * @param options.renderer The server renderer exported by integration.
	 */
	public addServerRenderer(options: AddServerRenderer): void {
		const { renderer } = options;
		if (!renderer.check || !renderer.renderToStaticMarkup) {
			throw new Error(
				"The renderer you passed isn't valid. A renderer is usually an object that exposes the `check` and `renderToStaticMarkup` functions.\n" +
					"Usually, the renderer is exported by a /server.js entrypoint e.g. `import renderer from '@astrojs/react/server.js'`",
			);
		}
		if (isNamedRenderer(renderer)) {
			this.#manifest.renderers.push({
				name: renderer.name,
				ssr: renderer,
			});
		} else if ('name' in options) {
			this.#manifest.renderers.push({
				name: options.name,
				ssr: renderer,
			});
		} else {
			throw new Error(
				'The renderer name must be provided when adding a server renderer that is not a named renderer.',
			);
		}
	}

	/**
	 * Use this function to manually add a **client** renderer to the container.
	 *
	 * When rendering components that use the `client:*` directives, you need to use this function.
	 *
	 * ## Example
	 *
	 * ```js
	 * import reactRenderer from "@astrojs/react/server.js";
	 * import { experimental_AstroContainer as AstroContainer } from "astro/container"
	 *
	 * const container = await AstroContainer.create();
	 * container.addServerRenderer(reactRenderer);
	 * container.addClientRenderer({
	 * 	name: "@astrojs/react",
	 * 	entrypoint: "@astrojs/react/client.js"
	 * });
	 * ```
	 *
	 * @param options {object}
	 * @param options.name The name of the renderer. The name **isn't** arbitrary, and it should match the name of the package.
	 * @param options.entrypoint The entrypoint of the client renderer.
	 */
	public addClientRenderer(options: AddClientRenderer): void {
		const { entrypoint, name } = options;

		const rendererIndex = this.#manifest.renderers.findIndex((r) => r.name === name);
		if (rendererIndex === -1) {
			throw new Error(
				'You tried to add the ' +
					name +
					" client renderer, but its server renderer wasn't added. You must add the server renderer first. Use the `addServerRenderer` function.",
			);
		}
		const renderer = this.#manifest.renderers[rendererIndex];
		renderer.clientEntrypoint = entrypoint;

		this.#manifest.renderers[rendererIndex] = renderer;
	}

	// NOTE: we keep this private via TS instead via `#` so it's still available on the surface, so we can play with it.
	// @ts-expect-error @ematipico: I plan to use it for a possible integration that could help people
	private static async createFromManifest(
		manifest: SSRManifest,
	): Promise<experimental_AstroContainer> {
		const container = new experimental_AstroContainer({
			manifest,
		});
		container.#withManifest = true;
		return container;
	}

	/**
	 * Associates a runtime-inserted route with its component module in the
	 * interner shared with the container environment record. Snapshots the
	 * already-resolved middleware synchronously via `peekMiddleware` —
	 * `undefined` when `getMiddleware` has not settled yet.
	 */
	#internRoute(routeData: RouteData, componentInstance: ComponentInstance): void {
		this.#interner.set(routeData, {
			page() {
				return Promise.resolve(componentInstance);
			},
			onRequest: peekMiddleware(this.#manifest),
		});
	}

	#insertRoute({
		path,
		componentInstance,
		params = {},
		type = 'page',
	}: {
		path: string;
		componentInstance: ComponentInstance;
		route?: string;
		params?: Record<string, string | undefined>;
		type?: RouteType;
	}): RouteData {
		const pathUrl = new URL(path, 'https://example.com');
		const routeData: RouteData = this.#createRoute(pathUrl, params, type);
		this.#manifest.routes.push({
			routeData,
			file: '',
			links: [],
			styles: [],
			scripts: [],
		});
		this.#internRoute(routeData, componentInstance);
		return routeData;
	}

	/**
	 * @description
	 * It renders a component and returns the result as a string.
	 *
	 * ## Example
	 *
	 * ```js
	 * import Card from "../src/components/Card.astro";
	 *
	 * const container = await AstroContainer.create();
	 * const result = await container.renderToString(Card);
	 *
	 * console.log(result); // it's a string
	 * ```
	 *
	 *
	 * @param {AstroComponentFactory} component The instance of the component.
	 * @param {ContainerRenderOptions=} options Possible options to pass when rendering the component.
	 */
	public async renderToString(
		component: AstroComponentFactory,
		options: ContainerRenderOptions = {},
	): Promise<string> {
		if (options.slots) {
			options.slots = markAllSlotsAsSlotString(options.slots);
		}

		const response = await this.renderToResponse(component, options);
		return await response.text();
	}

	/**
	 * @description
	 * It renders a component and returns the `Response` as result of the rendering phase.
	 *
	 * ## Example
	 *
	 * ```js
	 * import Card from "../src/components/Card.astro";
	 *
	 * const container = await AstroContainer.create();
	 * const response = await container.renderToResponse(Card);
	 *
	 * console.log(response.status); // it's a number
	 * ```
	 *
	 *
	 * @param {AstroComponentFactory} component The instance of the component.
	 * @param {ContainerRenderOptions=} options Possible options to pass when rendering the component.
	 */
	public async renderToResponse(
		component: AstroComponentFactory,
		options: ContainerRenderOptions = {},
	): Promise<Response> {
		const { routeType = 'page', slots } = options;
		const request = options?.request ?? new Request('https://example.com/');
		const url = new URL(request.url);
		const componentInstance =
			routeType === 'endpoint'
				? (component as unknown as ComponentInstance)
				: this.#wrapComponent(component, options.params);
		const routeData = this.#insertRoute({
			path: request.url,
			componentInstance,
			params: options.params,
			type: routeType,
		});
		const state = new FetchState(this.#manifest, request);
		state.routeData = routeData;
		state.pathname = url.pathname;
		state.clientAddress = '';
		state.partial = options?.partial ?? true;
		state.componentInstance = componentInstance;
		state.slots = slots ?? {};
		if (options.params) {
			state.params = options.params;
		}
		state.locals = (options?.locals ?? {}) as App.Locals;
		if (options.props) {
			state.initialProps = options.props;
		}
		return handleMiddleware(state, handlePages);
	}

	/**
	 * It stores an Astro **page** route. The first argument, `route`, gets associated to the `component`.
	 *
	 * This function can be useful when you want to render a route via `AstroContainer.renderToString`, where that
	 * route eventually renders another route via `Astro.rewrite`.
	 *
	 * @param {string} route - The URL that will render the component.
	 * @param {AstroComponentFactory} component - The component factory to be used for rendering the route.
	 * @param {Record<string, string | undefined>} params - An object containing key-value pairs of route parameters.
	 */
	public insertPageRoute(
		route: string,
		component: AstroComponentFactory,
		params?: Record<string, string | undefined>,
	) {
		const url = new URL(route, 'https://example.com/');
		const routeData: RouteData = this.#createRoute(url, params ?? {}, 'page');
		this.#manifest.routes.push({
			routeData,
			file: '',
			links: [],
			styles: [],
			scripts: [],
		});
		const componentInstance = this.#wrapComponent(component, params);
		this.#internRoute(routeData, componentInstance);
	}

	#createRoute(url: URL, params: Record<string, string | undefined>, type: RouteType): RouteData {
		const segments = removeLeadingForwardSlash(url.pathname)
			.split('/')
			.filter(Boolean)
			.map((s: string) => {
				validateSegment(s);
				return getParts(s, url.pathname);
			});
		return {
			route: url.pathname,
			component: '',
			params: Object.keys(params),
			pattern: getPattern(
				segments,
				ASTRO_CONFIG_DEFAULTS.base,
				ASTRO_CONFIG_DEFAULTS.trailingSlash,
			),
			prerender: false,
			segments,
			type,
			fallbackRoutes: [],
			isIndex: false,
			origin: 'internal',
			distURL: [],
		};
	}

	/**
	 * If the provided component isn't a default export, the function wraps it in an object `{default: Component }` to mimic the default export.
	 * @param componentFactory
	 * @param params
	 * @private
	 */
	#wrapComponent(
		componentFactory: AstroComponentFactory,
		params?: Record<string, string | undefined>,
	): ComponentInstance {
		if (params) {
			return {
				default: componentFactory,
				getStaticPaths() {
					return [{ params }];
				},
			};
		}
		return { default: componentFactory };
	}
}

function isNamedRenderer(renderer: any): renderer is NamedSSRLoadedRendererValue {
	return !!renderer?.name;
}

function markAllSlotsAsSlotString(slots: Record<string, any>): Record<string, any> {
	const markedSlots: Record<string, any> = {};
	for (const slotName in slots) {
		markedSlots[slotName] = new SlotString(slots[slotName], null);
	}
	return markedSlots;
}
