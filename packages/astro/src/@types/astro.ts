import type babel from '@babel/core';
import type { z } from 'zod';
import type { AstroConfigSchema } from '../core/config';
import type { AstroComponentFactory, Metadata } from '../runtime/server';
import type vite from '../core/vite';

export interface AstroBuiltinProps {
	'client:load'?: boolean;
	'client:idle'?: boolean;
	'client:media'?: string;
	'client:visible'?: boolean;
}

export interface AstroComponentMetadata {
	displayName: string;
	hydrate?: 'load' | 'idle' | 'visible' | 'media' | 'only';
	hydrateArgs?: any;
	componentUrl?: string;
	componentExport?: { value: string; namespace?: boolean };
}

/** The flags supported by the Astro CLI */
export interface CLIFlags {
	projectRoot?: string;
	site?: string;
	sitemap?: boolean;
	hostname?: string;
	port?: number;
	config?: string;
	experimentalStaticBuild?: boolean;
	experimentalSsr?: boolean;
	drafts?: boolean;
}

/**
 * Astro.* available in all components
 * Docs: https://docs.astro.build/reference/api-reference/#astro-global
 */
export interface AstroGlobal extends AstroGlobalPartial {
	/** set props for this astro component (along with default values) */
	props: Record<string, number | string | any>;
	/** get information about this page */
	request: {
		/** get the current page URL */
		url: URL;
		/** get the current canonical URL */
		canonicalURL: URL;
		/** get page params (dynamic pages only) */
		params: Params;
	};
	/** see if slots are used */
	slots: Record<string, true | undefined>;
}

export interface AstroGlobalPartial {
	fetchContent<T = any>(globStr: string): Promise<FetchContentResult<T>[]>;
	resolve: (path: string) => string;
	site: URL;
}

/**
 * Astro User Config
 * Docs: https://docs.astro.build/reference/configuration-reference/
 */
export interface AstroUserConfig {
	/**
	 * Where to resolve all URLs relative to. Useful if you have a monorepo project.
	 * Default: '.' (current working directory)
	 */
	projectRoot?: string;
	/**
	 * Path to the `astro build` output.
	 * Default: './dist'
	 */
	dist?: string;
	/**
	 * Path to all of your Astro components, pages, and data.
	 * Default: './src'
	 */
	src?: string;
	/**
	 * Path to your Astro/Markdown pages. Each file in this directory
	 * becomes a page in your final build.
	 * Default: './src/pages'
	 */
	pages?: string;
	/**
	 * Path to your public files. These are copied over into your build directory, untouched.
	 * Useful for favicons, images, and other files that don't need processing.
	 * Default: './public'
	 */
	public?: string;
	/**
	 * Framework component renderers enable UI framework rendering (static and dynamic).
	 * When you define this in your configuration, all other defaults are disabled.
	 * Default: [
	 *  '@astrojs/renderer-svelte',
	 *  '@astrojs/renderer-vue',
	 *  '@astrojs/renderer-react',
	 *  '@astrojs/renderer-preact',
	 * ],
	 */
	renderers?: string[];
	/** Options for rendering markdown content */
	markdownOptions?: {
		render?: MarkdownRenderOptions;
	};
	/** Options specific to `astro build` */
	buildOptions?: {
		/** Your public domain, e.g.: https://my-site.dev/. Used to generate sitemaps and canonical URLs. */
		site?: string;
		/**
		 * Generate an automatically-generated sitemap for your build.
		 * Default: true
		 */
		sitemap?: boolean;
		/**
		 * Control the output file URL format of each page.
		 *   If 'file', Astro will generate a matching HTML file (ex: "/foo.html") instead of a directory.
		 *   If 'directory', Astro will generate a directory with a nested index.html (ex: "/foo/index.html") for each page.
		 * Default: 'directory'
		 */
		pageUrlFormat?: 'file' | 'directory';
		/**
		 * Control if markdown draft pages should be included in the build.
		 * 	`true`: Include draft pages
		 * 	`false`: Exclude draft pages
		 * Default: false
		 */
		drafts?: boolean;
		/**
		 * Experimental: Enables "static build mode" for faster builds.
		 * Default: false
		 */
		experimentalStaticBuild?: boolean;
		/**
		 * Enable a build for SSR support.
		 */
		experimentalSsr?: boolean;
	};
	/** Options for the development server run with `astro dev`. */
	devOptions?: {
		hostname?: string;
		/** The port to run the dev server on. */
		port?: number;
		/**
		 * Configure The trailing slash behavior of URL route matching:
		 *   'always' - Only match URLs that include a trailing slash (ex: "/foo/")
		 *   'never' - Never match URLs that include a trailing slash (ex: "/foo")
		 *   'ignore' - Match URLs regardless of whether a trailing "/" exists
		 * Default: 'always'
		 */
		trailingSlash?: 'always' | 'never' | 'ignore';
	};
	/** Pass configuration options to Vite */
	vite?: vite.InlineConfig;
}

// NOTE(fks): We choose to keep our hand-generated AstroUserConfig interface so that
// we can add JSDoc-style documentation and link to the definition file in our repo.
// However, Zod comes with the ability to auto-generate AstroConfig from the schema
// above. If we ever get to the point where we no longer need the dedicated
// @types/config.ts file, consider replacing it with the following lines:
//
// export interface AstroUserConfig extends z.input<typeof AstroConfigSchema> {
// }

/**
 * Resolved Astro Config
 * Config with user settings along with all defaults filled in.
 */
export type AstroConfig = z.output<typeof AstroConfigSchema>;

export type AsyncRendererComponentFn<U> = (Component: any, props: any, children: string | undefined, metadata?: AstroComponentMetadata) => Promise<U>;

/** Generic interface for a component (Astro, Svelte, React, etc.) */
export interface ComponentInstance {
	$$metadata: Metadata;
	default: AstroComponentFactory;
	css?: string[];
	getStaticPaths?: (options: GetStaticPathsOptions) => GetStaticPathsResult;
}

/**
 * Astro.fetchContent() result
 * Docs: https://docs.astro.build/reference/api-reference/#astrofetchcontent
 */
export type FetchContentResult<T> = FetchContentResultBase & T;

export type FetchContentResultBase = {
	astro: {
		headers: string[];
		source: string;
		html: string;
	};
	url: string;
};

export type GetHydrateCallback = () => Promise<(element: Element, innerHTML: string | null) => void>;

/**
 * getStaticPaths() options
 * Docs: https://docs.astro.build/reference/api-reference/#getstaticpaths
 */ export interface GetStaticPathsOptions {
	paginate?: PaginateFunction;
	rss?: (...args: any[]) => any;
}

export type GetStaticPathsItem = { params: Params; props?: Props };
export type GetStaticPathsResult = GetStaticPathsItem[];
export type GetStaticPathsResultKeyed = GetStaticPathsResult & {
	keyed: Map<string, GetStaticPathsItem>;
};

export interface HydrateOptions {
	name: string;
	value?: string;
}

export interface JSXTransformConfig {
	/** Babel presets */
	presets?: babel.PluginItem[];
	/** Babel plugins */
	plugins?: babel.PluginItem[];
}

export type JSXTransformFn = (options: { mode: string; ssr: boolean }) => Promise<JSXTransformConfig>;

export interface ManifestData {
	routes: RouteData[];
}

export type MarkdownRenderOptions = [string | MarkdownParser, Record<string, any>];
export type MarkdownParser = (contents: string, options?: Record<string, any>) => MarkdownParserResponse | PromiseLike<MarkdownParserResponse>;

export interface MarkdownParserResponse {
	frontmatter: {
		[key: string]: any;
	};
	metadata: {
		headers: any[];
		source: string;
		html: string;
	};
	code: string;
}

/**
 * paginate() Options
 * Docs: https://docs.astro.build/guides/pagination/#calling-the-paginate-function
 */
export interface PaginateOptions {
	/** the number of items per-page (default: `10`) */
	pageSize?: number;
	/** key: value object of page params (ex: `{ tag: 'javascript' }`) */
	params?: Params;
	/** object of props to forward to `page` result */
	props?: Props;
}

/**
 * Page Prop
 * Docs: https://docs.astro.build/guides/pagination/#using-the-page-prop
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
	/** number of items per page (default: 25) */
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
	};
}

export type PaginateFunction = (data: [], args?: PaginateOptions) => GetStaticPathsResult;

export type Params = Record<string, string | undefined>;

export type Props = Record<string, unknown>;

export interface RenderPageOptions {
	request: {
		params?: Params;
		url: URL;
		canonicalURL: URL;
	};
	children: any[];
	props: Props;
	css?: string[];
}

type Body = string;

export interface EndpointOutput<Output extends Body = Body> {
	body: Output;
}

export interface EndpointHandler {
	[method: string]: (params: any) => EndpointOutput;
}

/**
 * Astro Renderer
 * Docs: https://docs.astro.build/reference/renderer-reference/
 */
export interface Renderer {
	/** Name of the renderer (required) */
	name: string;
	/** Import statement for renderer */
	source?: string;
	/** Import statement for the server renderer */
	serverEntry: string;
	/** Scripts to be injected before component */
	polyfills?: string[];
	/** Polyfills that need to run before hydration ever occurs */
	hydrationPolyfills?: string[];
	/** JSX identifier (e.g. 'react' or 'solid-js') */
	jsxImportSource?: string;
	/** Babel transform options */
	jsxTransformOptions?: JSXTransformFn;
	/** Utilies for server-side rendering */
	ssr: {
		check: AsyncRendererComponentFn<boolean>;
		renderToStaticMarkup: AsyncRendererComponentFn<{
			html: string;
		}>;
	};
	/** Return configuration object for Vite ("options" should match https://vitejs.dev/guide/api-plugin.html#config) */
	viteConfig?: (options: { mode: 'string'; command: 'build' | 'serve' }) => Promise<vite.InlineConfig>;
	/** @deprecated Don’t try and build these dependencies for client (deprecated in 0.21) */
	external?: string[];
	/** @deprecated Clientside requirements (deprecated in 0.21) */
	knownEntrypoints?: string[];
}

export type RouteType = 'page' | 'endpoint';

export interface RouteData {
	component: string;
	generate: (data?: any) => string;
	params: string[];
	pathname?: string;
	pattern: RegExp;
	type: RouteType;
}

export type SerializedRouteData = Omit<RouteData, 'generate' | 'pattern'> & {
	generate: undefined;
	pattern: string;
};

export type RuntimeMode = 'development' | 'production';

/**
 * RSS
 * Docs: https://docs.astro.build/reference/api-reference/#rss
 */
export interface RSS {
	/** (required) Title of the RSS Feed */
	title: string;
	/** (required) Description of the RSS Feed */
	description: string;
	/** Specify arbitrary metadata on opening <xml> tag */
	xmlns?: Record<string, string>;
	/**
	 * If false (default), does not include XSL stylesheet.
	 * If true, automatically includes 'pretty-feed-v3'.
	 * If a string value, specifies a local custom XSL stylesheet, for example '/custom-feed.xsl'.
	 */
	stylesheet?: string | boolean;
	/** Specify custom data in opening of file */
	customData?: string;
	/**
	 * Specify where the RSS xml file should be written.
	 * Relative to final build directory. Example: '/foo/bar.xml'
	 * Defaults to '/rss.xml'.
	 */
	dest?: string;
	/** Return data about each item */
	items: {
		/** (required) Title of item */
		title: string;
		/** (required) Link to item */
		link: string;
		/** Publication date of item */
		pubDate?: Date;
		/** Item description */
		description?: string;
		/** Append some other XML-valid data to this item */
		customData?: string;
	}[];
}

export type RSSFunction = (args: RSS) => RSSResult;

export type FeedResult = { url: string; content?: string };
export type RSSResult = { xml: FeedResult; xsl?: FeedResult };

export type SSRError = Error & vite.ErrorPayload['err'];

export interface SSRElement {
	props: Record<string, any>;
	children: string;
}

export interface SSRMetadata {
	renderers: Renderer[];
	pathname: string;
	experimentalStaticBuild: boolean;
}

export interface SSRResult {
	styles: Set<SSRElement>;
	scripts: Set<SSRElement>;
	links: Set<SSRElement>;
	createAstro(Astro: AstroGlobalPartial, props: Record<string, any>, slots: Record<string, any> | null): AstroGlobal;
	resolve: (s: string) => Promise<string>;
	_metadata: SSRMetadata;
}
