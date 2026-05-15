import type { AstroComponentFactory } from '../runtime/server/index.js';
import type { Props } from '../types/public/common.js';
import type { AstroUserConfig } from '../types/public/config.js';
import type {
	NamedSSRLoadedRendererValue,
	RouteType,
	SSRLoadedRenderer,
	SSRLoadedRendererValue,
	SSRManifest,
	SSRResult,
} from '../types/public/internal.js';
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
	 * Allows to pass `Astro.props` to an Astro component:
	 *
	 * ```js
	 * container.renderToString(Endpoint, { props: { "lorem": "ipsum" } });
	 * ```
	 */
	props?: Props;
	/**
	 * When `false`, it forces to render the component as it was a full-fledged page.
	 *
	 * By default, the container API render components as [partials](https://docs.astro.build/en/basics/astro-pages/#page-partials).
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
	resolve?: SSRResult['resolve'];
	/**
	 * @default {}
	 * @description
	 *
	 * The raw manifest from the build output.
	 */
	manifest?: SSRManifest;
};
export declare class experimental_AstroContainer {
	#private;
	private constructor();
	/**
	 * Creates a new instance of a container.
	 *
	 * @param {AstroContainerOptions=} containerOptions
	 */
	static create(containerOptions?: AstroContainerOptions): Promise<experimental_AstroContainer>;
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
	addServerRenderer(options: AddServerRenderer): void;
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
	addClientRenderer(options: AddClientRenderer): void;
	private static createFromManifest;
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
	renderToString(
		component: AstroComponentFactory,
		options?: ContainerRenderOptions,
	): Promise<string>;
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
	renderToResponse(
		component: AstroComponentFactory,
		options?: ContainerRenderOptions,
	): Promise<Response>;
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
	insertPageRoute(
		route: string,
		component: AstroComponentFactory,
		params?: Record<string, string | undefined>,
	): void;
}
