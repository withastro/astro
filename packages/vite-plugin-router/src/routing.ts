import type { AstroComponentFactory } from '@astrojs/vite-plugin-astro';
import type { APIContext, RewritePayload } from './context.js';
import type { RouteData } from './types.js';

type Simplify<T> = { [KeyType in keyof T]: T[KeyType] } & {};

type OmitIndexSignature<ObjectType> = {
	[KeyType in keyof ObjectType as object extends Record<KeyType, unknown>
		? never
		: KeyType]: ObjectType[KeyType];
};

/**
 * getStaticPaths() options
 *
 * [Astro Reference](https://docs.astro.build/en/reference/routing-reference/#getstaticpaths)
 */
export interface GetStaticPathsOptions {
	paginate: PaginateFunction;
	routePattern: string;
}

export type GetStaticPathsItem = {
	params: Params;
	props?: Props;
	cacheKey?: string | number;
};
export type GetStaticPathsResult = GetStaticPathsItem[];
export type GetStaticPathsResultKeyed = GetStaticPathsResult & {
	keyed: Map<string, GetStaticPathsItem>;
};

/**
 * Return an array of pages to generate for a [dynamic route](https://docs.astro.build/en/guides/routing/#dynamic-routes). (**SSG Only**)
 *
 * [Astro Reference](https://docs.astro.build/en/reference/routing-reference/#getstaticpaths)
 */
export type GetStaticPaths = (
	options: GetStaticPathsOptions,
) => Promise<GetStaticPathsResult> | GetStaticPathsResult;

/**
 * paginate() Options
 *
 * [Astro reference](https://docs.astro.build/en/reference/routing-reference/#paginate)
 */
export interface PaginateOptions<PaginateProps extends Props, PaginateParams extends Params> {
	/** the number of items per-page (default: `10`) */
	pageSize?: number;
	/** key: value object of page params (ex: `{ tag: 'javascript' }`) */
	params?: PaginateParams;
	/** object of props to forward to `page` result */
	props?: PaginateProps;
	/**
	 * Transform each pagination URL before it is set on the page result.
	 * Useful for adding a file extension (e.g. `.html`) when deploying to a
	 * static file server that does not support clean URLs.
	 *
	 * @example
	 * ```ts
	 * paginate(items, {
	 *   format: (url) => `${url}.html`,
	 * })
	 * ```
	 */
	format?: (url: string) => string;
}

/**
 * Represents a single page of data in a paginated collection
 *
 * [Astro reference](https://docs.astro.build/en/reference/routing-reference/#the-pagination-page-prop)
 */
export interface Page<T = any> {
	/** result */
	data: T[];
	/** metadata */
	/** the count of the first item on the page, starting from 0 */
	start: number;
	/** the count of the last item on the page, starting from 0 */
	end: number;
	/** total number of results */
	total: number;
	/** the current page number, starting from 1 */
	currentPage: number;
	/** number of items per page (default: 10) */
	size: number;
	/** number of last page */
	lastPage: number;
	url: {
		/** url of the current page */
		current: string;
		/** url of the previous page (if there is one) */
		prev: string | undefined;
		/** url of the next page (if there is one) */
		next: string | undefined;
		/** url of the first page (if the current page is not the first page) */
		first: string | undefined;
		/** url of the last page (if the current page is not the last page) */
		last: string | undefined;
	};
}

export type PaginateFunction = <
	PaginateData,
	AdditionalPaginateProps extends Props,
	AdditionalPaginateParams extends Params,
>(
	data: readonly PaginateData[],
	args?: PaginateOptions<AdditionalPaginateProps, AdditionalPaginateParams>,
) => {
	params: Simplify<
		{
			page: string | undefined;
		} & OmitIndexSignature<AdditionalPaginateParams>
	>;
	props: Simplify<
		{
			page: Page<PaginateData>;
		} & OmitIndexSignature<AdditionalPaginateProps>
	>;
}[];

export type APIRoute<
	APIProps extends Record<string, any> = Record<string, any>,
	APIParams extends Record<string, string | undefined> = Record<string, string | undefined>,
> = (context: APIContext<APIProps, APIParams>) => Response | Promise<Response>;

export type MiddlewareNext = (rewritePayload?: RewritePayload) => Promise<Response>;
export type MiddlewareHandler = (
	context: APIContext,
	next: MiddlewareNext,
) => Promise<Response> | Response | Promise<void> | void;

// NOTE: when adding exports, update astro's `plugin-page.ts` too, to add them as no-op functions.
export type AstroMiddlewareInstance = {
	onRequest?: MiddlewareHandler;
};

/**
 * Infers the shape of the `params` property returned by `getStaticPaths()`.
 *
 * @example
 * ```ts
 * import type { GetStaticPaths } from 'astro';
 *
 * export const getStaticPaths = (() => {
 *   return results.map((entry) => ({
 *     params: { slug: entry.slug },
 *   }));
 * }) satisfies GetStaticPaths;
 *
 * type Params = InferGetStaticParamsType<typeof getStaticPaths>;
 * //   ^? { slug: string; }
 *
 * const { slug } = Astro.params as Params;
 * ```
 */
export type InferGetStaticParamsType<T> = T extends (
	opts?: GetStaticPathsOptions,
) => infer R | Promise<infer R>
	? R extends Array<infer U>
		? U extends { params: infer P }
			? P
			: never
		: never
	: never;

/**
 * Infers the shape of the `props` property returned by `getStaticPaths()`.
 *
 * @example
 * ```ts
 * import type { GetStaticPaths } from 'astro';
 *
 * export const getStaticPaths = (() => {
 *   return results.map((entry) => ({
 *     params: { slug: entry.slug },
 *     props: {
 *       propA: true,
 *       propB: 42
 *     },
 *   }));
 * }) satisfies GetStaticPaths;
 *
 * type Props = InferGetStaticPropsType<typeof getStaticPaths>;
 * //   ^? { propA: boolean; propB: number; }
 *
 * const { propA, propB } = Astro.props;
 * ```
 */
export type InferGetStaticPropsType<T> = T extends (
	opts: GetStaticPathsOptions,
) => infer R | Promise<infer R>
	? R extends Array<infer U>
		? U extends { props: infer P }
			? P
			: never
		: never
	: never;

export type Params = Record<string, string | undefined>;
export type Props = Record<string, unknown>;

/** Generic interface for a component (Astro, Svelte, React, etc.) */
export interface ComponentInstance {
	default: AstroComponentFactory;
	css?: string[];
	partial?: boolean;
	prerender?: boolean;
	getStaticPaths?: GetStaticPaths;
}

export interface RoutesList {
	routes: RouteData[];
}

export type SerializedRouteData = Omit<
	RouteData,
	'generate' | 'pattern' | 'redirectRoute' | 'fallbackRoutes'
> & {
	pattern: string;
	redirectRoute: SerializedRouteData | undefined;
	fallbackRoutes: SerializedRouteData[];
	_meta: {
		trailingSlash: 'always' | 'never' | 'ignore';
	};
};

/** A page's server module in the build output, loaded on demand by the manifest's `pageMap`. */
export interface SinglePageBuiltModule {
	page: () => Promise<ComponentInstance>;
	/**
	 * The `onRequest` hook exported by the middleware
	 */
	onRequest?: MiddlewareHandler;
}
