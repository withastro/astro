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
	 * Information about the outgoing response. This is a standard [ResponseInit](https://developer.mozilla.org/en-US/docs/Web/API/Response/Response#init) object
	 *
	 * For example, to change the status code you can set a different status on this object:
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
	 * The <Astro.self /> element allows a component to reference itself recursively.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/astro-syntax/#astroself)
	 */
	self: Self;

	/** Utility functions for modifying an Astro component’s slotted children
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/astro-syntax/#astroslots)
	 */
	slots: Record<string, true | undefined> & {
		/**
		 * Check whether content for this slot name exists
		 *
		 * ## Example
		 *
		 * ```typescript
		 *	if (Astro.slots.has('default')) {
		 *   // Do something...
		 *	}
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/astro-syntax/#astroslotshas)
		 */
		has(slotName: string): boolean;

		/**
		 * Asynchronously renders this slot and returns a string
		 *
		 * ## Example
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
		 * ## Example
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
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#site)
	 */
	site: URL | undefined;

	/**
	 * A human-readable string representing the Astro version used to create the project.
	 * For example, `"Astro v1.1.1"`.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#generator)
	 */
	generator: string;

	/**
	 * The address (usually IP address) of the user.
	 *
	 * Throws an error if used within a static site, or within a prerendered page.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#clientaddress)
	 */
	clientAddress: string;

	/**
	 * Utility for getting and setting the values of cookies.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#cookies)
	 */
	cookies: AstroCookies;

	/**
	 * Utility for handling sessions.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#session)
	 */
	session?: AstroSession;

	/** Information about the current request. This is a standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object
	 *
	 * For example, to get a URL object of the current URL, you can use:
	 * ```typescript
	 * const url = new URL(Astro.request.url);
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#request)
	 */
	request: Request;

	/**
	 * The url of the current request, parsed as an instance of `URL`.
	 *
	 * Equivalent to:
	 * ```ts
	 * new URL(context.request.url)
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#url)
	 */
	url: URL;

	/**
	 * The origin pathname of the request URL.
	 * Useful to track the original URL before rewrites were applied.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#originpathname)
	 */
	originPathname: string;

	/**
	 * Get an action result on the server when using a form POST.
	 * Expects the action function as a parameter.
	 * Returns a type-safe result with the action data when
	 * a matching POST request is received
	 * and `undefined` otherwise.
	 *
	 * ## Example
	 *
	 * ```typescript
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
	 * Call an Action directly from an Astro page or API endpoint.
	 * Expects the action function as the first parameter,
	 * and the type-safe action input as the second parameter.
	 * Returns a Promise with the action result.
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
	 * List of props passed from `getStaticPaths`. Only available to static builds.
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
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#params)
	 */
	params: Params;

	/**
	 * List of props returned for this path by `getStaticPaths` (**Static Only**).
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#props)
	 */
	props: Props;

	/**
	 * Create a response that redirects to another page.
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
	 * It reroutes to another page. As opposed to redirects, the URL won't change, and Astro will render the HTML emitted
	 * by the rerouted URL passed as argument.
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
	 * Inside a `.astro` file:
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
	 * Available only when `i18n` configured and in SSR.
	 *
	 * It represents the preferred locale of the user. It's computed by checking the supported locales in `i18n.locales`
	 * and locales supported by the users's browser via the header `Accept-Language`
	 *
	 * For example, given `i18n.locales` equals to `['fr', 'de']`, and the `Accept-Language` value equals to `en, de;q=0.2, fr;q=0.6`, the
	 * `Astro.preferredLanguage` will be `fr` because `en` is not supported, its [quality value](https://developer.mozilla.org/en-US/docs/Glossary/Quality_values) is the highest.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#preferredlocale)
	 */
	preferredLocale: string | undefined;

	/**
	 * Available only when `i18n` configured and in SSR.
	 *
	 * It represents the list of the preferred locales that are supported by the application. The list is sorted via [quality value](https://developer.mozilla.org/en-US/docs/Glossary/Quality_values).
	 *
	 * For example, given `i18n.locales` equals to `['fr', 'pt', 'de']`, and the `Accept-Language` value equals to `en, de;q=0.2, fr;q=0.6`, the
	 * `Astro.preferredLocaleList` will be equal to `['fs', 'de']` because `en` isn't supported, and `pt` isn't part of the locales contained in the
	 * header.
	 *
	 * When the `Accept-Header` is `*`, the original `i18n.locales` are returned. The value `*` means no preferences, so Astro returns all the supported locales.
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
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#routepattern)
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
