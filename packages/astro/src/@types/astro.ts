import type * as babel from '@babel/core';
import type { z } from 'zod';
import type { AstroConfigSchema } from '../core/config';
import type { AstroComponentFactory, Metadata } from '../runtime/server';
import type * as vite from 'vite';

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
	/** @deprecated */
	experimentalStaticBuild?: boolean;
	experimentalSsr?: boolean;
	legacyBuild?: boolean;
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
	slots: Record<string, true | undefined> & { has(slotName: string): boolean; render(slotName: string): Promise<string> };
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
	 * @docs
	 * @kind heading
	 * @name Top-Level Options
	 */

	/**
	 * @docs
	 * @name projectRoot
	 * @cli --project-root
	 * @type {string}
	 * @default `"."` (current working directory)
	 * @summary Set the project root. The project root is the directory where your Astro project (and all `src`, `public` and `package.json` files) live.
	 * @description  You should only provide this option if you run the `astro` CLI commands in a directory other than the project root directory. Usually, this option is provided via the CLI instead of the `astro.config.js` file, since Astro needs to know your project root before it can locate your config file.
	 *
	 * If you provide a relative path (ex: `--project-root: './my-project'`) Astro will resolve it against your current working directory.
	 *
	 * #### Examples
	 *
	 * ```js
	 * {
	 *   projectRoot: './my-project-directory'
	 * }
	 * ```
	 * ```bash
	 * $ astro build --project-root ./my-project-directory
	 * ```
	 */
	projectRoot?: string;

	/**
	 * @docs
	 * @name dist
	 * @type {string}
	 * @default `"./dist"`
	 * @description Set the directory that `astro build` writes your final build to.
	 *
	 * The value can be either an absolute file system path or a path relative to the project root.
	 *
	 * ```js
	 * {
	 *   dist: './my-custom-build-directory'
	 * }
	 * ```
	 */
	dist?: string;

	/**
	 * @docs
	 * @name public
	 * @type {string}
	 * @default `"./public"`
	 * @description
	 * Set the directory for your static assets. Files in this directory are served at `/` during dev and copied to your build directory during build. These files are always served or copied as-is, without transform or bundling.
	 *
	 * The value can be either an absolute file system path or a path relative to the project root.
	 *
	 * ```js
	 * {
	 *   public: './my-custom-public-directory'
	 * }
	 * ```
	 */
	public?: string;

	/**
	 * @docs
	 * @name renderers
	 * @type {string[]}
	 * @default `['@astrojs/renderer-svelte','@astrojs/renderer-vue','@astrojs/renderer-react','@astrojs/renderer-preact']`
	 * @description
	 * Set the UI framework renderers for your project. Framework renderers are what power Astro's ability to use other frameworks inside of your project, like React, Svelte, and Vue.
	 *
	 * Setting this configuration will disable Astro's default framework support, so you will need to provide a renderer for every framework that you want to use.
	 *
	 * ```js
	 * {
	 *   // Use Astro + React, with no other frameworks.
	 *   renderers: ['@astrojs/renderer-react']
	 * }
	 * ```
	 */
	renderers?: string[];

	/**
	 * @docs
	 * @name markdownOptions
	 * @type {{render: MarkdownRenderOptions}}
	 * @see [Markdown guide](/en/guides/markdown-content/)
	 * @description
	 * Configure how markdown files (`.md`) are rendered.
	 *
	 * ```js
	 * {
	 *   markdownOptions: {
	 *     // Add a Remark plugin to your project.
	 *     remarkPlugins: [
	 *       ['remark-autolink-headings', { behavior: 'prepend'}],
	 *     ],
	 *     // Add a Rehype plugin to your project.
	 *     rehypePlugins: [
	 *       'rehype-slug',
	 *       ['rehype-autolink-headings', { behavior: 'prepend'}],
	 *     ],
	 *     // Customize syntax highlighting
	 * 	   syntaxHighlight: 'shiki',
	 *   },
	 * }
	 * ```
	 */
	markdownOptions?: {
		render?: MarkdownRenderOptions;
	};

	/**
	 * @docs
	 * @kind heading
	 * @name Build Options
	 */
	buildOptions?: {
		/**
		 * @docs
		 * @name buildOptions.site
		 * @type {string}
		 * @description
		 * Your final, deployed URL. Astro uses this full URL to generate your sitemap and canonical URLs in your final build. It is strongly recommended that you set this configuration to get the most out of Astro.
		 *
		 * Astro will match the site pathname during development so that your development experience matches your build environment as closely as possible. In the example below, `astro dev` will start your server at `http://localhost:3000/docs`.
		 *
		 * ```js
		 * {
		 *   buildOptions: {
		 *     // Example: Tell Astro the final URL of your deployed website.
		 * 	   site: 'https://www.my-site.dev/docs'
		 *   }
		 * }
		 * ```
		 */
		site?: string;

		/**
		 * @docs
		 * @name buildOptions.sitemap
		 * @type {boolean}
		 * @default `true`
		 * @description
		 * Generate a sitemap for your build. Set to false to disable.
		 *
		 * Astro will automatically generate a sitemap including all generated pages on your site. If you need more control over your sitemap, consider generating it yourself using a [Non-HTML Page](/en/core-concepts/astro-pages/#non-html-pages).
		 *
		 * ```js
		 * {
		 *   buildOptions: {
		 *     // Example: Disable automatic sitemap generation
		 * 	   sitemap: false
		 *   }
		 * }
		 * ```
		 */
		sitemap?: boolean;

		/**
		 * @docs
		 * @name buildOptions.sitemapFilter
		 * @type {undefined|((page: string) => boolean)}
		 * @default `undefined`
		 * @description
		 * Customize sitemap generation for your build by excluding certain pages.
		 *
		 * ```js
		 * {
		 *   buildOptions: {
		 * 	   sitemap: true
		 * 	   sitemapFilter: (page) => !page.includes('secret-page')
		 *   }
		 * }
		 * ```
		 */
		sitemapFilter?: (page: string) => boolean

		/**
		 * @docs
		 * @name buildOptions.pageUrlFormat
		 * @type {('file' | 'directory')}
		 * @default `'directory'`
		 * @description
		 * Control the output file format of each page.
		 *   - If 'file', Astro will generate an HTML file (ex: "/foo.html") for each page.
		 *   - If 'directory', Astro will generate a directory with a nested `index.html` file (ex: "/foo/index.html") for each page.
		 *
		 * ```js
		 * {
		 *   buildOptions: {
		 *     // Example: Generate `page.html` instead of `page/index.html` during build.
		 * 	   pageUrlFormat: 'file'
		 *   }
		 * }
		 * ```
		 */
		pageUrlFormat?: 'file' | 'directory';

		/**
		 * @docs
		 * @name buildOptions.drafts
		 * @type {boolean}
		 * @default `false`
		 * @description
		 * Control if markdown draft pages should be included in the build.
		 *
		 * A markdown page is considered a draft if it includes `draft: true` in its front matter. Draft pages are always included & visible during development (`astro dev`) but by default they will not be included in your final build.
		 *
		 * ```js
		 * {
		 *   buildOptions: {
		 *     // Example: Include all drafts in your final build
		 * 	   drafts: true,
		 *   }
		 * }
		 * ```
		 */
		drafts?: boolean;
		/**
		 * Enables "legacy build mode" for compatibility with older Astro versions.
		 * Default: false
		 */
		legacyBuild?: boolean;
		/**
		 * @deprecated
		 * Experimental: Enables "static build mode" for faster builds.
		 * Default: true
		 */
		experimentalStaticBuild?: boolean;
		/**
		 * Enable a build for SSR support.
		 * Default: false
		 */
		experimentalSsr?: boolean;
	};

	/**
	 * @docs
	 * @kind heading
	 * @name Dev Options
	 */
	devOptions?: {
		/**
		 * @docs
		 * @name devOptions.hostname
		 * @type {string}
		 * @default `'localhost'`
		 * @description
		 * Set which IP addresses the dev server should listen on. Set this to 0.0.0.0 to listen on all addresses, including LAN and public addresses.
		 */
		hostname?: string;

		/**
		 * @docs
		 * @name devOptions.port
		 * @type {number}
		 * @default `3000`
		 * @description
		 * Set which port the dev server should listen on.
		 *
		 * If the given port is already in use, Astro will automatically try the next available port.
		 */
		port?: number;

		/**
		 * @docs
		 * @name devOptions.trailingSlash
		 * @type {('always' | 'never' | 'ignore')}
		 * @default `'always'`
		 * @see buildOptions.pageUrlFormat
		 * @description
		 *
		 * Set the route matching behavior of the dev server. Choose from the following options:
		 *   - 'always' - Only match URLs that include a trailing slash (ex: "/foo/")
		 *   - 'never' - Never match URLs that include a trailing slash (ex: "/foo")
		 *   - 'ignore' - Match URLs regardless of whether a trailing "/" exists
		 *
		 * Use this configuration option if your production host has strict handling of how trailing slashes work or do not work.
		 *
		 * You can also set this if you prefer to be more strict yourself, so that URLs with or without trailing slashes won't work during development.
		 *
		 * ```js
		 * {
		 *   devOptions: {
		 *     // Example: Require a trailing slash during development
		 * 	   trailingSlash: 'always'
		 *   }
		 * }
		 * ```
		 */
		trailingSlash?: 'always' | 'never' | 'ignore';
	};

	/**
	 * @docs
	 * @name devOptions.vite
	 * @type {vite.UserConfig}
	 * @description
	 *
	 * Pass additional configuration options to Vite. Useful when Astro doesn't support some advanced configuration that you may need.
	 *
	 * View the full `vite` configuration object documentation on [vitejs.dev](https://vitejs.dev/config/).
	 *
	 * #### Examples
	 *
	 * ```js
	 * {
	 *   vite: {
	 * 	   ssr: {
	 *      // Example: Force a broken package to skip SSR processing, if needed
	 * 		external: ['broken-npm-package'],
	 *     }
	 *   }
	 * }
	 * ```
	 *
	 * ```js
	 * {
	 *   vite: {
	 *     // Example: Add custom vite plugins directly to your Astro project
	 * 	   plugins: [myPlugin()],
	 *   }
	 * }
	 * ```
	 */
	vite?: vite.UserConfig & { ssr?: vite.SSROptions };
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
	legacyBuild: boolean;
}

export interface SSRResult {
	styles: Set<SSRElement>;
	scripts: Set<SSRElement>;
	links: Set<SSRElement>;
	createAstro(Astro: AstroGlobalPartial, props: Record<string, any>, slots: Record<string, any> | null): AstroGlobal;
	resolve: (s: string) => Promise<string>;
	_metadata: SSRMetadata;
}
