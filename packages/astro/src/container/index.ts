import { posix } from 'node:path';
import type {
	AstroRenderer,
	AstroUserConfig,
	ComponentInstance,
	MiddlewareHandler,
	RouteData,
	RouteType,
	SSRLoadedRenderer,
	SSRManifest,
	SSRResult,
} from '../@types/astro.js';
import { validateConfig } from '../core/config/config.js';
import { ASTRO_CONFIG_DEFAULTS } from '../core/config/schema.js';
import { Logger } from '../core/logger/core.js';
import { nodeLogDestination } from '../core/logger/node.js';
import { removeLeadingForwardSlash } from '../core/path.js';
import { RenderContext } from '../core/render-context.js';
import { getParts, getPattern, validateSegment } from '../core/routing/manifest/create.js';
import type { AstroComponentFactory } from '../runtime/server/index.js';
import { ContainerPipeline } from './pipeline.js';

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
	 * Useful in case you're attempting to render an endpoint:
	 * ```js
	 * container.renderToString(Endpoint, { routeType: "endpoint" });
	 * ```
	 */
	routeType?: RouteType;
};

function createManifest(
	renderers: SSRLoadedRenderer[],
	manifest?: AstroContainerManifest,
	middleware?: MiddlewareHandler
): SSRManifest {
	const defaultMiddleware: MiddlewareHandler = (_, next) => {
		return next();
	};

	return {
		rewritingEnabled: false,
		trailingSlash: manifest?.trailingSlash ?? ASTRO_CONFIG_DEFAULTS.trailingSlash,
		buildFormat: manifest?.buildFormat ?? ASTRO_CONFIG_DEFAULTS.build.format,
		compressHTML: manifest?.compressHTML ?? ASTRO_CONFIG_DEFAULTS.compressHTML,
		assets: manifest?.assets ?? new Set(),
		assetsPrefix: manifest?.assetsPrefix ?? undefined,
		entryModules: manifest?.entryModules ?? {},
		routes: manifest?.routes ?? [],
		adapterName: '',
		clientDirectives: manifest?.clientDirectives ?? new Map(),
		renderers: manifest?.renderers ?? renderers,
		base: manifest?.base ?? ASTRO_CONFIG_DEFAULTS.base,
		componentMetadata: manifest?.componentMetadata ?? new Map(),
		inlinedScripts: manifest?.inlinedScripts ?? new Map(),
		i18n: manifest?.i18n,
		checkOrigin: false,
		middleware: manifest?.middleware ?? middleware ?? defaultMiddleware,
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
	manifest?: AstroContainerManifest;
	resolve?: SSRResult['resolve'];
};

export class experimental_AstroContainer {
	#pipeline: ContainerPipeline;

	/**
	 * Internally used to check if the container was created with a manifest.
	 * @private
	 */
	#withManifest = false;

	private constructor({
		streaming = false,
		renderers = [],
		manifest,
		resolve,
	}: AstroContainerConstructor) {
		this.#pipeline = ContainerPipeline.create({
			logger: new Logger({
				level: 'info',
				dest: nodeLogDestination,
			}),
			manifest: createManifest(renderers, manifest),
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
			return new URL(found, ASTRO_CONFIG_DEFAULTS.build.client).toString();
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
	): Promise<experimental_AstroContainer> {
		const { streaming = false, renderers = [] } = containerOptions;
		const loadedRenderers = await Promise.all(
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

		return new experimental_AstroContainer({ streaming, renderers: finalRenderers });
	}

	// NOTE: we keep this private via TS instead via `#` so it's still available on the surface, so we can play with it.
	// @ematipico: I plan to use it for a possible integration that could help people
	private static async createFromManifest(
		manifest: SSRManifest
	): Promise<experimental_AstroContainer> {
		const config = await validateConfig(ASTRO_CONFIG_DEFAULTS, process.cwd(), 'container');
		const container = new experimental_AstroContainer({
			manifest,
		});
		container.#withManifest = true;
		return container;
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
		const renderContext = RenderContext.create({
			pipeline: this.#pipeline,
			routeData,
			status: 200,
			middleware: this.#pipeline.middleware,
			request,
			pathname: url.pathname,
			locals: options?.locals ?? {},
		});
		if (options.params) {
			renderContext.params = options.params;
		}

		return renderContext.render(componentInstance, slots);
	}

	#createRoute(url: URL, params: Record<string, string | undefined>, type: RouteType): RouteData {
		const segments = removeLeadingForwardSlash(url.pathname)
			.split(posix.sep)
			.filter(Boolean)
			.map((s: string) => {
				validateSegment(s);
				return getParts(s, url.pathname);
			});
		return {
			route: url.pathname,
			component: '',
			generate(_data: any): string {
				return '';
			},
			params: Object.keys(params),
			pattern: getPattern(
				segments,
				ASTRO_CONFIG_DEFAULTS.base,
				ASTRO_CONFIG_DEFAULTS.trailingSlash
			),
			prerender: false,
			segments,
			type,
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
	#wrapComponent(
		componentFactory: AstroComponentFactory,
		params?: Record<string, string | undefined>
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
