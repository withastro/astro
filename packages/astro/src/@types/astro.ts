import type { AddressInfo } from 'net';
import type * as babel from '@babel/core';
import type * as vite from 'vite';
import { z } from 'zod';
import type {
	ShikiConfig,
	RemarkPlugins,
	RehypePlugins,
	MarkdownHeader,
	MarkdownMetadata,
	MarkdownRenderingResult,
} from '@astrojs/markdown-remark';
import type { AstroConfigSchema } from '../core/config';
import type { AstroComponentFactory, Metadata } from '../runtime/server';
import type { ViteConfigWithSSR } from '../core/create-vite';
import type { SerializedSSRManifest } from '../core/app/types';
export type { SSRManifest } from '../core/app/types';

export interface AstroBuiltinProps {
	'client:load'?: boolean;
	'client:idle'?: boolean;
	'client:media'?: string;
	'client:visible'?: boolean;
	'client:only'?: boolean | string;
}

export interface AstroBuiltinAttributes {
	'class:list'?:
		| Record<string, boolean>
		| Record<any, any>
		| Iterable<string>
		| Iterable<any>
		| string;
	'set:html'?: any;
	'set:text'?: any;
	'is:raw'?: boolean;
}

export interface AstroDefineVarsAttribute {
	'define:vars'?: any;
}

export interface AstroStyleAttributes {
	/** @deprecated Use `is:global` instead */
	global?: boolean;
	'is:global'?: boolean;
	'is:inline'?: boolean;
}

export interface AstroScriptAttributes {
	/** @deprecated Hoist is now the default behavior */
	hoist?: boolean;
	'is:inline'?: boolean;
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
	root?: string;
	site?: string;
	host?: string | boolean;
	port?: number;
	config?: string;
	experimentalSsr?: boolean;
	experimentalIntegrations?: boolean;
	drafts?: boolean;
}

export interface BuildConfig {
	client: URL;
	server: URL;
	serverEntry: string;
	staticMode: boolean | undefined;
}

/**
 * Astro global available in all contexts in .astro files
 *
 * [Astro reference](https://docs.astro.build/reference/api-reference/#astro-global)
 */
export interface AstroGlobal extends AstroGlobalPartial {
	/** Canonical URL of the current page. If the [site](https://docs.astro.build/en/reference/configuration-reference/#site) config option is set, its origin will be the origin of this URL.
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#astrocanonicalurl)
	 */
	canonicalURL: URL;
	/** Parameters passed to a dynamic page generated using [getStaticPaths](https://docs.astro.build/en/reference/api-reference/#getstaticpaths)
	 *
	 * Example usage:
	 * ```astro
	 * ---
	 * export async function getStaticPaths() {
	 *    return [
	 *     { params: { id: '1' } },
	 *   ];
	 * }
	 *
	 * const { id } = Astro.params;
	 * ---
	 * <h1>{id}</h1>
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#params)
	 */
	params: Params;
	/** List of props passed to this component
	 *
	 * A common way to get specific props is through [destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment), ex:
	 * ```typescript
	 * const { name } = Astro.props
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/core-concepts/astro-components/#component-props)
	 */
	props: Record<string, number | string | any>;
	/** Information about the current request. This is a standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object
	 *
	 * For example, to get a URL object of the current URL, you can use:
	 * ```typescript
	 * const url = new URL(Astro.request.url);
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#astrorequest)
	 */
	request: Request;
	/** Redirect to another page (**SSR Only**)
	 *
	 * Example usage:
	 * ```typescript
	 * if(!isLoggedIn) {
	 *   return Astro.redirect('/login');
	 * }
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/guides/server-side-rendering/#astroredirect)
	 */
	redirect(path: string): Response;
	/**
	 * The <Astro.self /> element allows a component to reference itself recursively.
	 *
	 * [Astro reference](https://docs.astro.build/en/guides/server-side-rendering/#astroself)
	 */
	self: AstroComponentFactory;
	/** Utility functions for modifying an Astro component’s slotted children
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#astroslots)
	 */
	slots: Record<string, true | undefined> & {
		/**
		 * Check whether content for this slot name exists
		 *
		 * Example usage:
		 * ```typescript
		 *	if (Astro.slots.has('default')) {
		 *   // Do something...
		 *	}
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#astroslots)
		 */
		has(slotName: string): boolean;
		/**
		 * Asychronously renders this slot and returns HTML
		 *
		 * Example usage:
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
		 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#astroslots)
		 */
		render(slotName: string, args?: any[]): Promise<string>;
	};
}

export interface AstroGlobalPartial {
	/**
	 * @deprecated since version 0.24. See the {@link https://astro.build/deprecated/resolve upgrade guide} for more details.
	 */
	resolve(path: string): string;
	/** @deprecated since version 0.26. Use [Astro.glob()](https://docs.astro.build/en/reference/api-reference/#astroglob) instead. */
	fetchContent(globStr: string): Promise<any[]>;
	/**
	 * Fetch local files into your static site setup
	 *
	 * Example usage:
	 * ```typescript
	 * const posts = await Astro.glob('../pages/post/*.md');
	 * ```
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#astroglob)
	 */
	glob(globStr: `${any}.astro`): Promise<ComponentInstance[]>;
	glob<T extends Record<string, any>>(globStr: `${any}.md`): Promise<MarkdownInstance<T>[]>;
	glob<T extends Record<string, any>>(globStr: string): Promise<T[]>;
	/**
	 * Returns a [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) object built from the [site](https://docs.astro.build/en/reference/configuration-reference/#site) config option
	 *
	 * If `site` is undefined, the URL object will instead be built from `localhost`
	 *
	 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#astrosite)
	 */
	site: URL;
}

type ServerConfig = {
	/**
	 * @name server.host
	 * @type {string | boolean}
	 * @default `false`
	 * @version 0.24.0
	 * @description
	 * Set which network IP addresses the dev server should listen on (i.e. 	non-localhost IPs).
	 * - `false` - do not expose on a network IP address
	 * - `true` - listen on all addresses, including LAN and public addresses
	 * - `[custom-address]` - expose on a network IP address at `[custom-address]`
	 */
	host?: string | boolean;

	/**
	 * @name server.port
	 * @type {number}
	 * @default `3000`
	 * @description
	 * Set which port the dev server should listen on.
	 *
	 * If the given port is already in use, Astro will automatically try the next available port.
	 */
	port?: number;
};

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
	 * @name root
	 * @cli --root
	 * @type {string}
	 * @default `"."` (current working directory)
	 * @summary Set the project root. The project root is the directory where your Astro project (and all `src`, `public` and `package.json` files) live.
	 * @description  You should only provide this option if you run the `astro` CLI commands in a directory other than the project root directory. Usually, this option is provided via the CLI instead of the `astro.config.js` file, since Astro needs to know your project root before it can locate your config file.
	 *
	 * If you provide a relative path (ex: `--root: './my-project'`) Astro will resolve it against your current working directory.
	 *
	 * #### Examples
	 *
	 * ```js
	 * {
	 *   root: './my-project-directory'
	 * }
	 * ```
	 * ```bash
	 * $ astro build --root ./my-project-directory
	 * ```
	 */
	root?: string;

	/**
	 * @docs
	 * @name srcDir
	 * @type {string}
	 * @default `"./src"`
	 * @description Set the directory that Astro will read your site from.
	 *
	 * The value can be either an absolute file system path or a path relative to the project root.
	 *
	 * ```js
	 * {
	 *   srcDir: './www'
	 * }
	 * ```
	 */
	srcDir?: string;

	/**
	 * @docs
	 * @name publicDir
	 * @type {string}
	 * @default `"./public"`
	 * @description
	 * Set the directory for your static assets. Files in this directory are served at `/` during dev and copied to your build directory during build. These files are always served or copied as-is, without transform or bundling.
	 *
	 * The value can be either an absolute file system path or a path relative to the project root.
	 *
	 * ```js
	 * {
	 *   publicDir: './my-custom-publicDir-directory'
	 * }
	 * ```
	 */
	publicDir?: string;

	/**
	 * @docs
	 * @name outDir
	 * @type {string}
	 * @default `"./dist"`
	 * @description Set the directory that `astro build` writes your final build to.
	 *
	 * The value can be either an absolute file system path or a path relative to the project root.
	 *
	 * ```js
	 * {
	 *   outDir: './my-custom-build-directory'
	 * }
	 * ```
	 */
	outDir?: string;

	/**
	 * @docs
	 * @name site
	 * @type {string}
	 * @description
	 * Your final, deployed URL. Astro uses this full URL to generate your sitemap and canonical URLs in your final build. It is strongly recommended that you set this configuration to get the most out of Astro.
	 *
	 * ```js
	 * {
	 *   site: 'https://www.my-site.dev'
	 * }
	 * ```
	 */
	site?: string;

	/**
	 * @docs
	 * @name base
	 * @type {string}
	 * @description
	 * The base path you're deploying to. Astro will match this pathname during development so that your development experience matches your build environment as closely as possible. In the example below, `astro dev` will start your server at `/docs`.
	 *
	 * ```js
	 * {
	 *   base: '/docs'
	 * }
	 * ```
	 */
	base?: string;

	/**
	 * @docs
	 * @name trailingSlash
	 * @type {('always' | 'never' | 'ignore')}
	 * @default `'always'`
	 * @see buildOptions.pageUrlFormat
	 * @description
	 *
	 * Set the route matching behavior of the dev server. Choose from the following options:
	 *   - `'always'` - Only match URLs that include a trailing slash (ex: "/foo/")
	 *   - `'never'` - Never match URLs that include a trailing slash (ex: "/foo")
	 *   - `'ignore'` - Match URLs regardless of whether a trailing "/" exists
	 *
	 * Use this configuration option if your production host has strict handling of how trailing slashes work or do not work.
	 *
	 * You can also set this if you prefer to be more strict yourself, so that URLs with or without trailing slashes won't work during development.
	 *
	 * ```js
	 * {
	 *   // Example: Require a trailing slash during development
	 *   trailingSlash: 'always'
	 * }
	 * ```
	 */
	trailingSlash?: 'always' | 'never' | 'ignore';

	/**
	 * @docs
	 * @kind heading
	 * @name Build Options
	 */
	build?: {
		/**
		 * @docs
		 * @name build.format
		 * @typeraw {('file' | 'directory')}
		 * @default `'directory'`
		 * @description
		 * Control the output file format of each page.
		 *   - If 'file', Astro will generate an HTML file (ex: "/foo.html") for each page.
		 *   - If 'directory', Astro will generate a directory with a nested `index.html` file (ex: "/foo/index.html") for each page.
		 *
		 * ```js
		 * {
		 *   build: {
		 *     // Example: Generate `page.html` instead of `page/index.html` during build.
		 *     format: 'file'
		 *   }
		 * }
		 * ```
		 */
		format?: 'file' | 'directory';
	};

	/**
	 * @docs
	 * @kind heading
	 * @name Server Options
	 * @description
	 *
	 * Customize the Astro dev server, used by both `astro dev` and `astro serve`.
	 *
	 * ```js
	 * {
	 *   server: {port: 1234, host: true}
	 * }
	 * ```
	 *
	 * To set different configuration based on the command run ("dev", "preview") a function can also be passed to this configuration option.
	 *
	 * ```js
	 * {
	 *   // Example: Use the function syntax to customize based on command
	 *   server: (command) => ({port: command === 'dev' ? 3000 : 4000})
	 * }
	 * ```
	 */

	/**
	 * @docs
	 * @name server.host
	 * @type {string | boolean}
	 * @default `false`
	 * @version 0.24.0
	 * @description
	 * Set which network IP addresses the dev server should listen on (i.e. 	non-localhost IPs).
	 * - `false` - do not expose on a network IP address
	 * - `true` - listen on all addresses, including LAN and public addresses
	 * - `[custom-address]` - expose on a network IP address at `[custom-address]`
	 */

	/**
	 * @docs
	 * @name server.port
	 * @type {number}
	 * @default `3000`
	 * @description
	 * Set which port the dev server should listen on.
	 *
	 * If the given port is already in use, Astro will automatically try the next available port.
	 */

	server?: ServerConfig | ((options: { command: 'dev' | 'preview' }) => ServerConfig);

	/**
	 * @docs
	 * @kind heading
	 * @name Markdown Options
	 */
	markdown?: {
		/**
		 * @docs
		 * @name markdown.drafts
		 * @type {boolean}
		 * @default `false`
		 * @description
		 * Control if markdown draft pages should be included in the build.
		 *
		 * A markdown page is considered a draft if it includes `draft: true` in its front matter. Draft pages are always included & visible during development (`astro dev`) but by default they will not be included in your final build.
		 *
		 * ```js
		 * {
		 *   markdown: {
		 *     // Example: Include all drafts in your final build
		 *     drafts: true,
		 *   }
		 * }
		 * ```
		 */
		drafts?: boolean;

		/**
		 * @docs
		 * @name markdown.mode
		 * @type {'md' | 'mdx'}
		 * @default `mdx`
		 * @description
		 * Control wheater to allow components inside markdown files ('mdx') or not ('md').
		 */
		mode?: 'md' | 'mdx';

		/**
		 * @docs
		 * @name markdown.shikiConfig
		 * @typeraw {Partial<ShikiConfig>}
		 * @description
		 * Shiki configuration options. See [the markdown configuration docs](https://docs.astro.build/en/guides/markdown-content/#shiki-configuration) for usage.
		 */
		shikiConfig?: Partial<ShikiConfig>;

		/**
		 * @docs
		 * @name markdown.syntaxHighlight
		 * @type {'shiki' | 'prism' | false}
		 * @default `shiki`
		 * @description
		 * Which syntax highlighter to use, if any.
		 * - `shiki` - use the [Shiki](https://github.com/shikijs/shiki) highlighter
		 * - `prism` - use the [Prism](https://prismjs.com/) highlighter
		 * - `false` - do not apply syntax highlighting.
		 *
		 * ```js
		 * {
		 *   markdown: {
		 *     // Example: Switch to use prism for syntax highlighting in Markdown
		 *     syntaxHighlight: 'prism',
		 *   }
		 * }
		 * ```
		 */
		syntaxHighlight?: 'shiki' | 'prism' | false;

		/**
		 * @docs
		 * @name markdown.remarkPlugins
		 * @type {RemarkPlugins}
		 * @description
		 * Pass a custom [Remark](https://github.com/remarkjs/remark) plugin to customize how your Markdown is built.
		 *
		 * **Note:** Enabling custom `remarkPlugins` or `rehypePlugins` removes Astro's built-in support for [GitHub-flavored Markdown](https://github.github.com/gfm/) support and [Smartypants](https://github.com/silvenon/remark-smartypants). You must explicitly add these plugins to your `astro.config.mjs` file, if desired.
		 *
		 * ```js
		 * {
		 *   markdown: {
		 *     // Example: The default set of remark plugins used by Astro
		 *     remarkPlugins: ['remark-code-titles', ['rehype-autolink-headings', { behavior: 'prepend' }]],
		 *   },
		 * };
		 * ```
		 */
		remarkPlugins?: RemarkPlugins;
		/**
		 * @docs
		 * @name markdown.rehypePlugins
		 * @type {RehypePlugins}
		 * @description
		 * Pass a custom [Rehype](https://github.com/remarkjs/remark-rehype) plugin to customize how your Markdown is built.
		 *
		 * **Note:** Enabling custom `remarkPlugins` or `rehypePlugins` removes Astro's built-in support for [GitHub-flavored Markdown](https://github.github.com/gfm/) support and [Smartypants](https://github.com/silvenon/remark-smartypants). You must explicitly add these plugins to your `astro.config.mjs` file, if desired.
		 *
		 * ```js
		 * {
		 *   markdown: {
		 *     // Example: The default set of rehype plugins used by Astro
		 *     rehypePlugins: ['rehype-slug', ['rehype-toc', { headings: ['h2', 'h3'] }], [addClasses, { 'h1,h2,h3': 'title' }]],
		 *   },
		 * };
		 * ```
		 */
		rehypePlugins?: RehypePlugins;
	};

	/**
	 * @name adapter
	 * @type {AstroIntegration}
	 * @default `undefined`
	 * @description
	 * Add an adapter to build for SSR (server-side rendering). An adapter makes it easy to connect a deployed Astro app to a hosting provider or runtime environment.
	 */
	adapter?: AstroIntegration;

	/**
	 * @docs
	 * @kind heading
	 * @name Integrations
	 * @description
	 *
	 * Extend Astro with custom integrations. Integrations are your one-stop-shop for adding framework support (like Solid.js), new features (like sitemaps), and new libraries (like Partytown and Turbolinks).
	 *
	 * Read our [Integrations Guide](/en/guides/integrations-guide/) for help getting started with Astro Integrations.
	 *
	 * ```js
	 * import react from '@astrojs/react';
	 * import tailwind from '@astrojs/tailwind';
	 * {
	 *   // Example: Add React + Tailwind support to Astro
	 *   integrations: [react(), tailwind()]
	 * }
	 * ```
	 */
	integrations?: Array<AstroIntegration | AstroIntegration[]>;

	/**
	 * @docs
	 * @kind heading
	 * @name Vite
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
	 *     ssr: {
	 *       // Example: Force a broken package to skip SSR processing, if needed
	 *       external: ['broken-npm-package'],
	 *     }
	 *   }
	 * }
	 * ```
	 *
	 * ```js
	 * {
	 *   vite: {
	 *     // Example: Add custom vite plugins directly to your Astro project
	 *     plugins: [myPlugin()],
	 *   }
	 * }
	 * ```
	 */
	vite?: vite.UserConfig & { ssr?: vite.SSROptions };

	experimental?: {
		/**
		 * Enable support for 3rd-party integrations.
		 * Default: false
		 */
		integrations?: boolean;

		/**
		 * Enable support for 3rd-party SSR adapters.
		 * Default: false
		 */
		ssr?: boolean;
	};

	// Legacy options to be removed

	/** @deprecated - Use "integrations" instead. Run Astro to learn more about migrating. */
	renderers?: never;
	/** @deprecated `projectRoot` has been renamed to `root` */
	projectRoot?: never;
	/** @deprecated `src` has been renamed to `srcDir` */
	src?: never;
	/** @deprecated `pages` has been removed. It is no longer configurable. */
	pages?: never;
	/** @deprecated `public` has been renamed to `publicDir` */
	public?: never;
	/** @deprecated `dist` has been renamed to `outDir` */
	dist?: never;
	/** @deprecated `styleOptions` has been renamed to `style` */
	styleOptions?: never;
	/** @deprecated `markdownOptions` has been renamed to `markdown` */
	markdownOptions?: never;
	/** @deprecated `buildOptions` has been renamed to `build` */
	buildOptions?: never;
	/** @deprecated `devOptions` has been renamed to `server` */
	devOptions?: never;
	/** @deprecated `experimentalIntegrations` has been renamed to `experimental: { integrations: true }` */
	experimentalIntegrations?: never;
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
 * IDs for different stages of JS script injection:
 * - "before-hydration": Imported client-side, before the hydration script runs. Processed & resolved by Vite.
 * - "head-inline": Injected into a script tag in the `<head>` of every page. Not processed or resolved by Vite.
 * - "page": Injected into the JavaScript bundle of every page. Processed & resolved by Vite.
 * - "page-ssr": Injected into the frontmatter of every Astro page. Processed & resolved by Vite.
 */
export type InjectedScriptStage = 'before-hydration' | 'head-inline' | 'page' | 'page-ssr';

/**
 * Resolved Astro Config
 * Config with user settings along with all defaults filled in.
 */
export interface AstroConfig extends z.output<typeof AstroConfigSchema> {
	// Public:
	// This is a more detailed type than zod validation gives us.
	// TypeScript still confirms zod validation matches this type.
	integrations: AstroIntegration[];
	adapter?: AstroIntegration;
	// Private:
	// We have a need to pass context based on configured state,
	// that is different from the user-exposed configuration.
	// TODO: Create an AstroConfig class to manage this, long-term.
	_ctx: {
		adapter: AstroAdapter | undefined;
		renderers: AstroRenderer[];
		scripts: { stage: InjectedScriptStage; content: string }[];
	};
}

export type AsyncRendererComponentFn<U> = (
	Component: any,
	props: any,
	children: string | undefined,
	metadata?: AstroComponentMetadata
) => Promise<U>;

/** Generic interface for a component (Astro, Svelte, React, etc.) */
export interface ComponentInstance {
	$$metadata: Metadata;
	default: AstroComponentFactory;
	css?: string[];
	getStaticPaths?: (options: GetStaticPathsOptions) => GetStaticPathsResult;
}

export interface MarkdownInstance<T extends Record<string, any>> {
	frontmatter: T;
	file: string;
	url: string | undefined;
	Content: AstroComponentFactory;
	getHeaders(): Promise<MarkdownHeader[]>;
	default: () => Promise<{
		metadata: MarkdownMetadata;
		frontmatter: MarkdownContent;
		$$metadata: Metadata;
		default: AstroComponentFactory;
	}>;
}

export type GetHydrateCallback = () => Promise<
	(element: Element, innerHTML: string | null) => void
>;

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

export type JSXTransformFn = (options: {
	mode: string;
	ssr: boolean;
}) => Promise<JSXTransformConfig>;

export interface ManifestData {
	routes: RouteData[];
}

export interface MarkdownParserResponse extends MarkdownRenderingResult {
	frontmatter: {
		[key: string]: any;
	};
}

/**
 * The `content` prop given to a Layout
 * https://docs.astro.build/guides/markdown-content/#markdown-layouts
 */
export interface MarkdownContent {
	[key: string]: any;
	astro: MarkdownMetadata;
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

export type Params = Record<string, string | number | undefined>;

export type Props = Record<string, unknown>;

type Body = string;

export interface AstroAdapter {
	name: string;
	serverEntrypoint?: string;
	exports?: string[];
	args?: any;
}

export interface EndpointOutput<Output extends Body = Body> {
	body: Output;
}

export interface EndpointHandler {
	[method: string]: (params: any, request: Request) => EndpointOutput | Response;
}

export interface AstroRenderer {
	/** Name of the renderer. */
	name: string;
	/** Import entrypoint for the client/browser renderer. */
	clientEntrypoint?: string;
	/** Import entrypoint for the server/build/ssr renderer. */
	serverEntrypoint: string;
	/** JSX identifier (e.g. 'react' or 'solid-js') */
	jsxImportSource?: string;
	/** Babel transform options */
	jsxTransformOptions?: JSXTransformFn;
}

export interface SSRLoadedRenderer extends AstroRenderer {
	ssr: {
		check: AsyncRendererComponentFn<boolean>;
		renderToStaticMarkup: AsyncRendererComponentFn<{
			html: string;
		}>;
	};
}

export interface AstroIntegration {
	/** The name of the integration. */
	name: string;
	/** The different hooks available to extend. */
	hooks: {
		'astro:config:setup'?: (options: {
			config: AstroConfig;
			command: 'dev' | 'build';
			updateConfig: (newConfig: Record<string, any>) => void;
			addRenderer: (renderer: AstroRenderer) => void;
			injectScript: (stage: InjectedScriptStage, content: string) => void;
			// TODO: Add support for `injectElement()` for full HTML element injection, not just scripts.
			// This may require some refactoring of `scripts`, `styles`, and `links` into something
			// more generalized. Consider the SSR use-case as well.
			// injectElement: (stage: vite.HtmlTagDescriptor, element: string) => void;
		}) => void;
		'astro:config:done'?: (options: {
			config: AstroConfig;
			setAdapter: (adapter: AstroAdapter) => void;
		}) => void | Promise<void>;
		'astro:server:setup'?: (options: { server: vite.ViteDevServer }) => void | Promise<void>;
		'astro:server:start'?: (options: { address: AddressInfo }) => void | Promise<void>;
		'astro:server:done'?: () => void | Promise<void>;
		'astro:build:ssr'?: (options: { manifest: SerializedSSRManifest }) => void | Promise<void>;
		'astro:build:start'?: (options: { buildConfig: BuildConfig }) => void | Promise<void>;
		'astro:build:setup'?: (options: {
			vite: ViteConfigWithSSR;
			target: 'client' | 'server';
		}) => void;
		'astro:build:done'?: (options: {
			pages: { pathname: string }[];
			dir: URL;
			routes: RouteData[];
		}) => void | Promise<void>;
	};
}

export type RouteType = 'page' | 'endpoint';

export interface RoutePart {
	content: string;
	dynamic: boolean;
	spread: boolean;
}

export interface RouteData {
	component: string;
	generate: (data?: any) => string;
	params: string[];
	pathname?: string;
	pattern: RegExp;
	segments: RoutePart[][];
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
	renderers: SSRLoadedRenderer[];
	pathname: string;
}

export interface SSRResult {
	styles: Set<SSRElement>;
	scripts: Set<SSRElement>;
	links: Set<SSRElement>;
	createAstro(
		Astro: AstroGlobalPartial,
		props: Record<string, any>,
		slots: Record<string, any> | null
	): AstroGlobal;
	resolve: (s: string) => Promise<string>;
	_metadata: SSRMetadata;
}
