import { posix } from 'node:path';
import { getDefaultClientDirectives } from '../core/client-directive/index.js';
import { ASTRO_CONFIG_DEFAULTS } from '../core/config/schemas/index.js';
import { validateConfig } from '../core/config/validate.js';
import { createKey } from '../core/encryption.js';
import { FetchState } from '../core/fetch/fetch-state.js';
import { AstroMiddleware } from '../core/middleware/astro-middleware.js';
import { NOOP_MIDDLEWARE_FN } from '../core/middleware/noop-middleware.js';
import { PagesHandler } from '../core/pages/handler.js';
import { removeLeadingForwardSlash } from '../core/path.js';
import { getParts } from '../core/routing/parts.js';
import { getPattern } from '../core/routing/pattern.js';
import { validateSegment } from '../core/routing/segment.js';
import { SlotString } from '../runtime/server/render/slot.js';
import { ContainerPipeline } from './pipeline.js';
import { createConsoleLogger } from '../core/logger/impls/console.js';
function createManifest(manifest, renderers, middleware) {
	function middlewareInstance() {
		return {
			onRequest: middleware ?? NOOP_MIDDLEWARE_FN,
		};
	}
	const root = new URL(import.meta.url);
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
		assets: manifest?.assets ?? /* @__PURE__ */ new Set(),
		assetsPrefix: manifest?.assetsPrefix ?? void 0,
		entryModules: manifest?.entryModules ?? {},
		routes: manifest?.routes ?? [],
		adapterName: '',
		clientDirectives: manifest?.clientDirectives ?? getDefaultClientDirectives(),
		renderers: renderers ?? manifest?.renderers ?? [],
		base: manifest?.base ?? ASTRO_CONFIG_DEFAULTS.base,
		userAssetsBase: manifest?.userAssetsBase ?? '',
		componentMetadata: manifest?.componentMetadata ?? /* @__PURE__ */ new Map(),
		inlinedScripts: manifest?.inlinedScripts ?? /* @__PURE__ */ new Map(),
		i18n: manifest?.i18n,
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
			latestAstroVersion: void 0,
			debugInfoOutput: '',
			placement: void 0,
		},
		logLevel: 'silent',
		experimentalQueuedRendering: manifest?.experimentalQueuedRendering ?? {
			enabled: false,
		},
		experimentalLogger: manifest?.experimentalLogger ?? void 0,
	};
}
class experimental_AstroContainer {
	#pipeline;
	#astroMiddleware;
	#pagesHandler;
	/**
	 * Internally used to check if the container was created with a manifest.
	 * @private
	 */
	#withManifest = false;
	constructor({ streaming = false, manifest, renderers, resolve, astroConfig }) {
		this.#pipeline = ContainerPipeline.create({
			logger: createConsoleLogger({ level: 'error' }),
			manifest: createManifest(manifest, renderers),
			streaming,
			renderers: renderers ?? manifest?.renderers ?? [],
			resolve: async (specifier) => {
				if (this.#withManifest) {
					return this.#containerResolve(specifier, astroConfig);
				} else if (resolve) {
					return resolve(specifier);
				}
				return specifier;
			},
		});
		this.#astroMiddleware = new AstroMiddleware(this.#pipeline);
		this.#pagesHandler = new PagesHandler(this.#pipeline);
	}
	async #containerResolve(specifier, astroConfig) {
		const found = this.#pipeline.manifest.entryModules[specifier];
		if (found) {
			return new URL(found, astroConfig?.build.client).toString();
		}
		return found;
	}
	/**
	 * Creates a new instance of a container.
	 *
	 * @param {AstroContainerOptions=} containerOptions
	 */
	static async create(containerOptions = {}) {
		const { streaming = false, manifest, renderers = [], resolve } = containerOptions;
		const astroConfig = await validateConfig(ASTRO_CONFIG_DEFAULTS, process.cwd(), 'container');
		return new experimental_AstroContainer({
			streaming,
			manifest,
			renderers,
			astroConfig,
			resolve,
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
	addServerRenderer(options) {
		const { renderer } = options;
		if (!renderer.check || !renderer.renderToStaticMarkup) {
			throw new Error(
				"The renderer you passed isn't valid. A renderer is usually an object that exposes the `check` and `renderToStaticMarkup` functions.\nUsually, the renderer is exported by a /server.js entrypoint e.g. `import renderer from '@astrojs/react/server.js'`",
			);
		}
		if (isNamedRenderer(renderer)) {
			this.#pipeline.manifest.renderers.push({
				name: renderer.name,
				ssr: renderer,
			});
		} else if ('name' in options) {
			this.#pipeline.manifest.renderers.push({
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
	addClientRenderer(options) {
		const { entrypoint, name } = options;
		const rendererIndex = this.#pipeline.manifest.renderers.findIndex((r) => r.name === name);
		if (rendererIndex === -1) {
			throw new Error(
				'You tried to add the ' +
					name +
					" client renderer, but its server renderer wasn't added. You must add the server renderer first. Use the `addServerRenderer` function.",
			);
		}
		const renderer = this.#pipeline.manifest.renderers[rendererIndex];
		renderer.clientEntrypoint = entrypoint;
		this.#pipeline.manifest.renderers[rendererIndex] = renderer;
	}
	// NOTE: we keep this private via TS instead via `#` so it's still available on the surface, so we can play with it.
	// @ts-expect-error @ematipico: I plan to use it for a possible integration that could help people
	static async createFromManifest(manifest) {
		const astroConfig = await validateConfig(ASTRO_CONFIG_DEFAULTS, process.cwd(), 'container');
		const container = new experimental_AstroContainer({
			manifest,
			astroConfig,
		});
		container.#withManifest = true;
		return container;
	}
	#insertRoute({ path, componentInstance, params = {}, type = 'page' }) {
		const pathUrl = new URL(path, 'https://example.com');
		const routeData = this.#createRoute(pathUrl, params, type);
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
	async renderToString(component, options = {}) {
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
	async renderToResponse(component, options = {}) {
		const { routeType = 'page', slots } = options;
		const request = options?.request ?? new Request('https://example.com/');
		const url = new URL(request.url);
		const componentInstance =
			routeType === 'endpoint' ? component : this.#wrapComponent(component, options.params);
		const routeData = this.#insertRoute({
			path: request.url,
			componentInstance,
			params: options.params,
			type: routeType,
		});
		const state = new FetchState(this.#pipeline, request);
		state.routeData = routeData;
		state.pathname = url.pathname;
		state.clientAddress = '';
		state.partial = options?.partial ?? true;
		state.componentInstance = componentInstance;
		state.slots = slots ?? {};
		if (options.params) {
			state.params = options.params;
		}
		state.locals = options?.locals ?? {};
		if (options.props) {
			state.initialProps = options.props;
		}
		return this.#astroMiddleware.handle(state, this.#pagesHandler.handle.bind(this.#pagesHandler));
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
	insertPageRoute(route, component, params) {
		const url = new URL(route, 'https://example.com/');
		const routeData = this.#createRoute(url, params ?? {}, 'page');
		this.#pipeline.manifest.routes.push({
			routeData,
			file: '',
			links: [],
			styles: [],
			scripts: [],
		});
		const componentInstance = this.#wrapComponent(component, params);
		this.#pipeline.insertRoute(routeData, componentInstance);
	}
	#createRoute(url, params, type) {
		const segments = removeLeadingForwardSlash(url.pathname)
			.split(posix.sep)
			.filter(Boolean)
			.map((s) => {
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
	#wrapComponent(componentFactory, params) {
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
function isNamedRenderer(renderer) {
	return !!renderer?.name;
}
function markAllSlotsAsSlotString(slots) {
	const markedSlots = {};
	for (const slotName in slots) {
		markedSlots[slotName] = new SlotString(slots[slotName], null);
	}
	return markedSlots;
}
export { experimental_AstroContainer };
