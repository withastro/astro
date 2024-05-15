import type {
	AstroConfig,
	ComponentInstance,
	MiddlewareHandler,
	RouteData,
	RouteType,
	SSRLoadedRenderer,
	SSRManifest,
	SSRResult,
	AstroUserConfig, 
	AstroRenderer,
} from '../@types/astro.js';
import { TestPipeline } from './pipeline.js';
import { Logger } from '../core/logger/core.js';
import { nodeLogDestination } from '../core/logger/node.js';
import type { SSRManifestI18n } from '../core/app/types.js';
import { toRoutingStrategy } from '../i18n/utils.js';
import { validateConfig } from '../core/config/config.js';
import { ASTRO_CONFIG_DEFAULTS } from '../core/config/schema.js';
import { RenderContext } from '../core/render-context.js';
import { posix } from 'node:path';
import { getParts, getPattern, validateSegment } from '../core/routing/manifest/create.js';
import { removeLeadingForwardSlash } from '../core/path.js';
import type {AstroComponentFactory} from "../runtime/server/index.js";

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
	 * Useful if your component needs to access some locals without the use a middleware.
	 * ```js
	 * container.renderToString(Component, { locals: { getSomeValue() {} } });
	 * ```
	 */
	locals?: App.Locals;
	/**
	 * Useful in case you're attempting to render an errored route.
	 */
	status?: number;
	/**
	 * Useful in case you're attempting to render an endpoint:
	 * ```js
	 * container.renderToString(Endpoint, { routeType: "endpoint" });
	 * ```
	 */
	routeType?: RouteType;

	/**
	 * Useful for dynamic routes. If your component is something like `src/pages/blog/[id]/[...slug]`, you'll want to provide:
	 * ```js
	 * container.renderToString(Component, { route: "/blog/[id]/[...slug]" });
	 * ```
	 */
	route?: string
};

/**
 * @param renderers
 * @param config
 * @param manifest
 * @param middleware
 */
function createContainerManifest(
	renderers: SSRLoadedRenderer[],
	config: AstroConfig,
	manifest?: AstroContainerManifest,
	middleware?: MiddlewareHandler
): SSRManifest {
	let i18nManifest: SSRManifestI18n | undefined = undefined;
	if (config?.i18n) {
		i18nManifest = {
			fallback: config?.i18n.fallback,
			strategy: toRoutingStrategy(config?.i18n.routing, config?.i18n.domains),
			defaultLocale: config?.i18n.defaultLocale,
			locales: config?.i18n.locales,
			domainLookupTable: {},
		};
	}
	const defaultMiddleware: MiddlewareHandler = (_, next) => {
		return next();
	};

	return {
		rewritingEnabled: false,
		trailingSlash: manifest?.trailingSlash ?? config?.trailingSlash,
		buildFormat: manifest?.buildFormat ?? config?.build.format,
		compressHTML: manifest?.compressHTML ?? config?.compressHTML,
		assets: manifest?.assets ?? new Set(),
		assetsPrefix: manifest?.assetsPrefix ?? undefined,
		entryModules: manifest?.entryModules ?? {},
		routes: manifest?.routes ?? [],
		adapterName: '',
		clientDirectives: manifest?.clientDirectives ?? new Map(),
		renderers: manifest?.renderers ?? renderers,
		base: manifest?.base ?? config?.base,
		componentMetadata: manifest?.componentMetadata ?? new Map(),
		inlinedScripts: manifest?.inlinedScripts ?? new Map(),
		i18n: manifest?.i18n ?? i18nManifest,
		checkOrigin: false,
		middleware: manifest?.middleware ?? middleware ?? defaultMiddleware,
	};
}

export type AstroContainerUserConfig = Omit<AstroUserConfig, 'integrations' | 'adapter' >

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
	 * List or renderers to use when rendering components. Usually they are entry points
	 * 
	 * ## Example
	 * 
	 * ```js
	 * const container = await AstroContainer.create({
	 * 	renderers: [{
	 * 	  name: "@astrojs/react"
	 * 	  client: "@astrojs/react/client.js"
	 * 	  server: "@astrojs/react/server.js"
	 * 	}]
	 * });
	 * ```
	 */
	renderers?: AstroRenderer[];
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
	| 'routes'
	| 'assets'
	| 'entryModules'
	| 'compressHTML'
	| 'trailingSlash'
	| 'buildFormat'
	| 'i18n'
>;

type AstroContainerConstructor = {
	streaming?: boolean;
	renderers?: SSRLoadedRenderer[];
	config: AstroConfig;
	manifest?: AstroContainerManifest;
	resolve?: SSRResult['resolve'];
};

export class unstable_AstroContainer {
	#pipeline: TestPipeline;
	#config: AstroConfig;

	/**
	 * Internally used to check if the container was created with a manifest.
	 * @private
	 */
	#withManifest = false;

	private constructor({
		streaming = false,
		renderers = [],
		config,
		manifest,
		resolve,
	}: AstroContainerConstructor) {
		this.#config = config;
		this.#pipeline = TestPipeline.create({
			logger: new Logger({
				level: 'info',
				dest: nodeLogDestination,
			}),
			manifest: createContainerManifest(renderers, config, manifest),
			streaming,
			serverLike: true,
			renderers,
			resolve: async (specifier: string) => {
				if (this.#withManifest) {
					return this.#containerResolve(specifier);
				} else if (resolve) {
					return resolve(specifier);
				}
				return specifier;
			},
		});
	}

	async #containerResolve(specifier: string): Promise<string> {
		const found = this.#pipeline.manifest.entryModules[specifier];
		if (found) {
			return new URL(found, this.#config.build.client).toString();
		}
		return found;
	}

	/**
	 * Creates a new instance of a container.
	 * 
	 * @param {AstroContainerOptions=} containerOptions
	 */
	public static async create(
		containerOptions: AstroContainerOptions = {}
	): Promise<unstable_AstroContainer> {
		const {
			astroConfig = ASTRO_CONFIG_DEFAULTS,
			streaming = false,
			renderers = [],
		} = containerOptions;
		const config = await validateConfig(astroConfig, process.cwd(), 'container');
		const loadedRenderers =  await Promise.all(
			renderers.map(async (renderer) => {
				const mod = await import(renderer.serverEntrypoint);
				if (typeof mod.default !== 'undefined') {
					return {
						...renderer,
						ssr: mod.default,
					} as SSRLoadedRenderer;
				}
				return undefined;
			})
		);
		const finalRenderers = loadedRenderers.filter((r): r is SSRLoadedRenderer => Boolean(r));
		
		return new unstable_AstroContainer({ streaming, renderers: finalRenderers, config });
	}

	// NOTE: we keep this private via TS instead via `#` so it's still available on the surface, so we can play with it.
	/**
	 * 
	 * @param manifest
	 * @private
	 */
	private static async createFromManifest(manifest: SSRManifest): Promise<unstable_AstroContainer> {
		const config = await validateConfig(ASTRO_CONFIG_DEFAULTS, process.cwd(), 'container');
		const container = new unstable_AstroContainer({
			manifest,
			config,
		});
		container.#withManifest = true;
		return container;
	}

	/**
	 * Use this method to manually insert a route inside the container.
	 *
	 * This method is useful if you're rending a component that attempt to render redirect or a rewrite.
	 *
	 * @param {object} options
	 * @param {string} options.path The path of the route. It has to match what you see in a URL browser, e.g. `/blog/12334/first-post`
	 * @param {ComponentInstance} options.componentInstance The a compile instance of the Astro component.
	 * @param {string[]} options.params The params of the route. Use these when your route is dynamic. For a route `/blog/[id]/[...dynamic]`, the params are `["id", "...dynamic"]`
	 * @param {RouteType} options.type The type of route.
	 */
	private insertRoute({
		path,
		route,
		componentInstance,
		params = {},
		type = 'page',
	}: {
		path: string;
		route: string,
		componentInstance: ComponentInstance;
		params?: Record<string, string | undefined>;
		type?: RouteType;
	}): RouteData {
		const pathUrl = new URL(path, 'https://example.com');
		const routeData: RouteData = this.#createRoute(pathUrl, route, params, type);
		this.#pipeline.manifest.routes.push({
			routeData,
			file: '',
			links: [],
			styles: [],
			scripts: [],
		});
		this.#pipeline.insertRoute(routeData, componentInstance);
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
		options: ContainerRenderOptions = {}
	): Promise<string> {
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
		options: ContainerRenderOptions = {}
	): Promise<Response> {
		const { routeType = 'page', slots, route = ""  } = options;
		const request = options?.request ?? new Request('https://example.com/');
		const url = new URL(request.url);
		const componentInstance = routeType === "endpoint" ? component as unknown as ComponentInstance : this.#wrapComponent(component, options.params);
		const routeData = this.insertRoute({
			route,
			path: request.url,
			componentInstance,
			params: options.params,
			type: routeType,
		});
		const renderContext = RenderContext.create({
			pipeline: this.#pipeline,
			routeData,
			status: options?.status ?? 200,
			middleware: this.#pipeline.middleware,
			request,
			pathname: url.pathname,
			locals: options?.locals ?? {},
		});

		return renderContext.render(componentInstance, slots);
	}

	#createRoute(url: URL, route: string | undefined = url.pathname, params: Record<string, string | undefined>, type: RouteType): RouteData {
		const segments = removeLeadingForwardSlash(route)
			.split(posix.sep)
			.filter(Boolean)
			.map((s: string) => {
				validateSegment(s);
				return getParts(s, route);
			});
		return {
			component: '',
			generate(_data: any): string {
				return '';
			},
			params: Object.keys(params),
			pattern: getPattern(segments, this.#config, this.#config.trailingSlash),
			prerender: false,
			segments,
			type,
			route,
			fallbackRoutes: [],
			isIndex: false,
		};
	}

	/**
	 * If the provided component isn't a default export, the function wraps it in an object `{default: Component }` to mimic the default export.
	 * @param componentFactory
	 * @param params
	 * @private
	 */
	#wrapComponent(componentFactory: AstroComponentFactory, params?: Record<string, string | undefined>): ComponentInstance {
		if (params){
			return {
				default: componentFactory,
				getStaticPaths() {
					return [{ params }];
				}
			}	
		}
		return ({ default: componentFactory  })
	}
}
