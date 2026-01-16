import type { z } from 'zod';
import type { ActionAccept, ActionClient, ActionReturnType } from '../../actions/runtime/server.js';
import type { SUPPORTED_MARKDOWN_FILE_EXTENSIONS } from '../../core/constants.js';
import type { AstroCookies } from '../../core/cookies/cookies.js';
import type { CspDirective, CspHash } from '../../core/csp/config.js';
import type { AstroSession } from '../../core/session.js';
import type { AstroComponentFactory } from '../../runtime/server/index.js';
import type { RewritePayload } from './common.js';
import type { ValidRedirectStatus } from './config.js';
import type { AstroInstance, MarkdownInstance, MDXInstance } from './content.js';

/**
 * Astro global available in all contexts in .astro files
 *
 * [Astro reference](https://docs.astro.build/en/reference/api-reference/)
 */
export interface AstroGlobal<
	Props extends Record<string, any> = Record<string, any>,
	Self = AstroComponentFactory,
	Params extends Record<string, string | undefined> = Record<string, string | undefined>,
> extends AstroGlobalPartial,
		AstroSharedContext<Props, Params> {
	/**
	 * A standard [ResponseInit](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#init) object describing the outgoing response.
	 *
	 * ## Example
	 *
	 * You can change the status code by assigning a value to this property:
	 * ```typescript
	 * Astro.response.status = 404;
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#response)
	 */
	response: ResponseInit & {
		readonly headers: Headers;
	};

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

/** Union type of supported markdown file extensions */
type MarkdownFileExtension = (typeof SUPPORTED_MARKDOWN_FILE_EXTENSIONS)[number];

export interface AstroGlobalPartial extends Pick<AstroSharedContext, 'site' | 'generator'> {
	/**
	 * Fetch local files into your static site setup
	 *
	 * ## Example
	 *
	 * ```typescript
	 * const posts = await Astro.glob('../pages/post/*.md');
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#astroglob)
	 * @deprecated `Astro.glob` is deprecated and will be removed in the next major version of Astro. Use `import.meta.glob` instead: https://vitejs.dev/guide/features.html#glob-import
	 */
	glob(globStr: `${any}.astro`): Promise<AstroInstance[]>;
	/**
	 * @deprecated `Astro.glob` is deprecated and will be removed in the next major version of Astro. Use `import.meta.glob` instead: https://vitejs.dev/guide/features.html#glob-import
	 */
	glob<T extends Record<string, any>>(
		globStr: `${any}${MarkdownFileExtension}`,
	): Promise<MarkdownInstance<T>[]>;
	/**
	 * @deprecated `Astro.glob` is deprecated and will be removed in the next major version of Astro. Use `import.meta.glob` instead: https://vitejs.dev/guide/features.html#glob-import
	 */
	glob<T extends Record<string, any>>(globStr: `${any}.mdx`): Promise<MDXInstance<T>[]>;
	/**
	 * @deprecated `Astro.glob` is deprecated and will be removed in the next major version of Astro. Use `import.meta.glob` instead: https://vitejs.dev/guide/features.html#glob-import
	 */
	glob<T extends Record<string, any>>(globStr: string): Promise<T[]>;
}

// Shared types between `Astro` global and API context object
export interface AstroSharedContext<
	Props extends Record<string, any> = Record<string, any>,
	Params extends Record<string, string | undefined> = Record<string, string | undefined>,
> {
	/**
	 * The site provided in the astro config, parsed as an instance of `URL`, without base.
	 * `undefined` if the site is not provided in the config.
	 *
	 * ## Example
	 *
	 * ```astro
	 * <link
	 *   rel="alternate"
	 *   type="application/rss+xml"
	 *   title="Your Site's Title"
	 *   href={new URL("rss.xml", Astro.site)}
	 * />
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#site)
	 */
	site: URL | undefined;

	/**
	 * A human-readable string representing the Astro version used to create the project. It follows the format "Astro v5.x.x".
	 *
	 * ## Example
	 *
	 * ```astro
	 * <meta name="generator" content={Astro.generator} />
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#generator)
	 */
	generator: string;

	/**
	 * The address (usually IP address) of the user.
	 *
	 * Throws an error if used within a static site, or within a prerendered page.
	 *
	 * ## Example
	 *
	 * ```ts
	 * import type { APIContext } from 'astro';
	 *
	 * export function GET({ clientAddress }: APIContext) {
	 *   return new Response(`Your IP address is: ${clientAddress}`);
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#clientaddress)
	 */
	clientAddress: string;

	/**
	 * An object containing utilities for reading and manipulating the values of cookies in on-demand routes.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#cookies)
	 */
	cookies: AstroCookies;

	/**
	 * An object containing utilities for handling sessions in on-demand rendered routes.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#session)
	 */
	session?: AstroSession;

	/**
	 * A standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object containing information about the current request.
	 *
	 * ## Example
	 *
	 * To get a URL object of the current URL, you can use:
	 * ```typescript
	 * const url = new URL(Astro.request.url);
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#request)
	 */
	request: Request;

	/**
	 * A URL object constructed from the current `request.url` value. This is
	 * equivalent to doing `new URL(context.request.url)`.
	 *
	 * ## Example
	 *
	 * ```astro
	 * <p>The current URL is: {Astro.url}</p>
	 * <p>The current URL pathname is: {Astro.url.pathname}</p>
	 * <p>The current URL origin is: {Astro.url.origin}</p>
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#url)
	 */
	url: URL;

	/**
	 * The origin pathname of the request URL.
	 * Useful to track the original URL before rewrites were applied.
	 *
	 * ## Example
	 *
	 * ```astro
	 * <p>The origin path is {Astro.originPathname}</p>
	 * <p>The rewritten path is {Astro.url.pathname}</p>
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#originpathname)
	 */
	originPathname: string;

	/**
	 * A function that returns the result of an Action submission when using a form POST.
	 *
	 * This accepts an action function as an argument and returns a type-safe
	 * data or error object when a submission is received. Otherwise, it will
	 * return undefined.
	 *
	 * @param {TAction} action - The action function to process.
	 * @returns {ActionReturnType<TAction> | undefined} An object describing the result of an action.
	 *
	 * ## Example
	 *
	 * ```astro
	 * import { actions } from 'astro:actions';
	 *
	 * const result = await Astro.getActionResult(actions.myAction);
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#getactionresult)
	 */
	getActionResult: <
		TAccept extends ActionAccept,
		TInputSchema extends z.ZodType,
		TAction extends ActionClient<unknown, TAccept, TInputSchema>,
	>(
		action: TAction,
	) => ActionReturnType<TAction> | undefined;

	/**
	 * A function used to call an Action handler directly from your Astro
	 * component or API endpoint.
	 *
	 * This accepts an Action function and a type-safe action input, and returns
	 * the result of the action as a Promise.
	 *
	 * ## Example
	 *
	 * ```typescript
	 * import { actions } from 'astro:actions';
	 *
	 * const result = await Astro.callAction(actions.getPost, { postId: 'test' });
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#callaction)
	 *
	 * @param {TAction} action - Any Action function.
	 * @param {Parameters<TAction>[0]} input - Any input that the given action receives.
	 */
	callAction: <
		TAccept extends ActionAccept,
		TInputSchema extends z.ZodType,
		TOutput,
		TAction extends
			| ActionClient<TOutput, TAccept, TInputSchema>
			| ActionClient<TOutput, TAccept, TInputSchema>['orThrow'],
	>(
		action: TAction,
		input: Parameters<TAction>[0],
	) => Promise<ActionReturnType<TAction>>;

	/**
	 * An object containing the values of dynamic route segments matched for a request.
	 *
	 * In static builds, this will be the `params` returned by [`getStaticPaths()`](https://docs.astro.build/en/reference/routing-reference/#getstaticpaths). With on-demand rendering, `params` can be any value matching the path segments in the dynamic route pattern.
	 *
	 * ## Example
	 *
	 * ```ts
	 * import type { APIContext } from "astro"
	 *
	 * export function getStaticPaths() {
	 *   return [
	 *     { params: { id: '0' }, props: { name: 'Sarah' } },
	 *     { params: { id: '1' }, props: { name: 'Chris' } },
	 *     { params: { id: '2' }, props: { name: 'Fuzzy' } },
	 *   ];
	 * }
	 *
	 * export function GET({ params }: APIContext): Response {
	 *   return new Response(`The current id is ${params.id}.`);
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#params)
	 */
	params: Params;

	/**
	 * An object containing any values that have been passed as component attributes. In static builds, this can also be the `props` returned by [`getStaticPaths()`](https://docs.astro.build/en/reference/routing-reference/#getstaticpaths).
	 *
	 * ## Example
	 *
	 * ```ts
	 * import type { APIContext } from "astro"
	 *
	 * export function getStaticPaths() {
	 *   return [
	 *     { params: { id: '0' }, props: { name: 'Sarah' } },
	 *     { params: { id: '1' }, props: { name: 'Chris' } },
	 *     { params: { id: '2' }, props: { name: 'Fuzzy' } },
	 *   ];
	 * }
	 *
	 * export function GET({ props }: APIContext): Response {
	 *   return new Response(`Hello ${props.name}!`);
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#props)
	 */
	props: Props;

	/**
	 * Create a response that redirects to another page.
	 *
	 * This accepts a custom status code when redirecting for on-demand rendered routes only.
	 *
	 * @param {string} path - The path to redirect to.
	 * @param {ValidRedirectStatus} [status] - An optional HTTP status code.
	 * @returns {Response} A Response object describing the redirection.
	 *
	 * ## Example
	 *
	 * ```ts
	 * // src/pages/secret.ts
	 * export function GET({ redirect }) {
	 *   return redirect('/login');
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#redirect)
	 */
	redirect: (path: string, status?: ValidRedirectStatus) => Response;

	/**
	 * Allows you to serve content from a different URL or path without
	 * redirecting the browser to a new page.
	 *
	 * As opposed to redirects, the URL won't change, and Astro will render the
	 * HTML emitted by the rerouted URL passed as argument.
	 *
	 * @param {RewritePayload} rewritePayload - The location of the path.
	 * @returns {Promise<Response>} A Response object describing the rewrite.
	 *
	 * ## Example
	 *
	 * ```ts
	 * // src/pages/secret.ts
	 * export function GET(ctx) {
	 *   return ctx.rewrite(new URL("../"), ctx.url);
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#rewrite)
	 */
	rewrite: (rewritePayload: RewritePayload) => Promise<Response>;

	/**
	 * An object that middlewares can use to store extra information related to the request.
	 *
	 * It will be made available to pages as `Astro.locals`, and to endpoints as `context.locals`.
	 *
	 * ## Example
	 *
	 * ```ts
	 * // src/middleware.ts
	 * import { defineMiddleware } from "astro:middleware";
	 *
	 * export const onRequest = defineMiddleware((context, next) => {
	 *   context.locals.greeting = "Hello!";
	 *   return next();
	 * });
	 * ```
	 * You can then access the value inside a `.astro` file:
	 * ```astro
	 * ---
	 * // src/pages/index.astro
	 * const greeting = Astro.locals.greeting;
	 * ---
	 * <h1>{greeting}</h1>
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#locals)
	 */
	locals: App.Locals;

	/**
	 * A computed value to find the best match between your visitor’s browser
	 * language preferences and the locales supported by your site.
	 *
	 * This property is only available for routes rendered on demand and cannot
	 * be used on prerendered, static pages.
	 *
	 * The preferred locale of the user is computed by checking the supported
	 * locales in `i18n.locales` and locales supported by the users's browser via
	 * the header `Accept-Language`.
	 *
	 * ## Example
	 *
	 * Given `i18n.locales` equals to `['fr', 'de']`, and the `Accept-Language` value equals to `en, de;q=0.2, fr;q=0.6`, the
	 * `Astro.preferredLanguage` will be `fr` because `en` is not supported, its [quality value](https://developer.mozilla.org/en-US/docs/Glossary/Quality_values) is the highest.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#preferredlocale)
	 */
	preferredLocale: string | undefined;

	/**
	 * Represents the list of all locales, sorted via [quality value](https://developer.mozilla.org/en-US/docs/Glossary/Quality_values), that are both
	 * requested by the browser and supported by your website.
	 *
	 * This property is only available for routes rendered on demand and cannot
	 * be used on prerendered, static pages.
	 *
	 * When the `Accept-Header` is `*`, the original `i18n.locales` are returned.
	 * The value `*` means no preferences, so Astro returns all the supported locales.
	 *
	 * ## Example
	 *
	 * Given `i18n.locales` equals to `['fr', 'pt', 'de']`, and the
	 * `Accept-Language` value equals to `en, de;q=0.2, fr;q=0.6`, the
	 * `Astro.preferredLocaleList` will be equal to `['fs', 'de']` because `en`
	 * isn't supported, and `pt` isn't part of the locales contained in the
	 * header.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#preferredlocalelist)
	 */
	preferredLocaleList: string[] | undefined;

	/**
	 * The current locale computed from the URL of the request. It matches the locales in `i18n.locales`, and returns `undefined` otherwise.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#currentlocale)
	 */
	currentLocale: string | undefined;

	/**
	 * Whether the current route is prerendered or not.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#isprerendered)
	 */
	isPrerendered: boolean;

	/**
	 * It exposes utilities to control CSP headers
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/experimental-flags/csp/)
	 */
	csp: {
		/**
		 * It adds a specific CSP directive to the route being rendered.
		 *
		 * @param {CspDirective} directive - The directive to add to the current page.
		 *
		 * ## Example
		 *
		 * ```js
		 * ctx.insertDirective("default-src 'self' 'unsafe-inline' https://example.com")
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/experimental-flags/csp/#cspinsertdirective)
		 */
		insertDirective: (directive: CspDirective) => void;

		/**
		 * It set the resource for the directive `style-src` in the route being rendered. It overrides Astro's default.
		 *
		 * @param {string} payload - The source to insert in the `style-src` directive.
		 *
		 * ## Example
		 *
		 * ```js
		 * ctx.insertStyleResource("https://styles.cdn.example.com/")
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/experimental-flags/csp/#cspinsertstyleresource)
		 */
		insertStyleResource: (payload: string) => void;

		/**
		 * Insert a single style hash to the route being rendered.
		 *
		 * @param {CspHash} hash - The hash to insert in the `style-src` directive.
		 *
		 * ## Example
		 *
		 * ```js
		 * ctx.insertStyleHash("sha256-1234567890abcdef1234567890")
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/experimental-flags/csp/#cspinsertstylehash)
		 */
		insertStyleHash: (hash: CspHash) => void;

		/**
		 * It set the resource for the directive `script-src` in the route being rendered.
		 *
		 * @param {string} resource - The source to insert in the `script-src` directive.
		 *
		 * ## Example
		 *
		 * ```js
		 * ctx.insertScriptResource("https://scripts.cdn.example.com/")
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/experimental-flags/csp/#cspinsertscriptresource)
		 */
		insertScriptResource: (resource: string) => void;

		/**
		 * Insert a single script hash to the route being rendered.
		 *
		 * @param {CspHash} hash - The hash to insert in the `script-src` directive.
		 *
		 * ## Example
		 *
		 * ```js
		 * ctx.insertScriptHash("sha256-1234567890abcdef1234567890")
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/experimental-flags/csp/#cspinsertscripthash)
		 */
		insertScriptHash: (hash: CspHash) => void;
	};

	/**
	 * The route currently rendered. It's stripped of the `srcDir` and the `pages` folder, and it doesn't contain the extension.
	 *
	 * ## Example
	 *
	 * - The value when rendering `src/pages/index.astro` will be `/`.
	 * - The value when rendering `src/pages/blog/[slug].astro` will be `/blog/[slug]`.
	 * - The value when rendering `src/pages/[...path].astro` will be `/[...path]`.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/routing-reference/#routepattern)
	 */
	routePattern: string;
}

/**
 * The `APIContext` is the object made available to endpoints and middleware.
 * It is a subset of the `Astro` global object available in pages.
 *
 * [Astro reference](https://docs.astro.build/en/reference/api-reference/)
 */
export type APIContext<
	Props extends Record<string, any> = Record<string, any>,
	Params extends Record<string, string | undefined> = Record<string, string | undefined>,
> = AstroSharedContext<Props, Params>;
