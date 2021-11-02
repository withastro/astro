import type babel from '@babel/core';
import type { z } from 'zod';
import type { AstroConfigSchema } from '../core/config';
import type { AstroComponentFactory, Metadata } from '../runtime/server';
import type vite from '../../vendor/vite';

export interface AstroComponentMetadata {
  displayName: string;
  hydrate?: 'load' | 'idle' | 'visible' | 'media' | 'only';
  hydrateArgs?: any;
  componentUrl?: string;
  componentExport?: { value: string; namespace?: boolean };
}

/**
 * The Astro User Config Format:
 * This is the type interface for your astro.config.mjs default export.
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
    render?: [string, Record<string, any>];
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

export type AstroConfig = z.output<typeof AstroConfigSchema>;

export type AsyncRendererComponentFn<U> = (Component: any, props: any, children: string | undefined, metadata?: AstroComponentMetadata) => Promise<U>;

export interface CollectionRSS {
  /** (required) Title of the RSS Feed */
  title: string;
  /** (required) Description of the RSS Feed */
  description: string;
  /** Specify arbitrary metadata on opening <xml> tag */
  xmlns?: Record<string, string>;
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

/** Generic interface for a component (Astro, Svelte, React, etc.) */
export interface ComponentInstance {
  $$metadata: Metadata;
  default: AstroComponentFactory;
  css?: string[];
  getStaticPaths?: (options: GetStaticPathsOptions) => GetStaticPathsResult;
}

export type GetStaticPathsArgs = { paginate: PaginateFunction; rss: RSSFunction };

export interface GetStaticPathsOptions {
  paginate?: PaginateFunction;
  rss?: (...args: any[]) => any;
}

export type GetStaticPathsResult = { params: Params; props?: Props }[] | { params: Params; props?: Props }[];

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

export interface PaginatedCollectionProp<T = any> {
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

export interface PaginatedCollectionResult<T = any> {
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

export type PaginateFunction = (data: [], args?: { pageSize?: number; params?: Params; props?: Props }) => GetStaticPathsResult;

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

export interface Renderer {
  /** Name of the renderer (required) */
  name: string;
  /** Import statement for renderer */
  source?: string;
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

/** <link> tags with attributes represented by an object */
export type Resource = Record<string, string>;

export interface RouteData {
  component: string;
  generate: (data?: any) => string;
  params: string[];
  pathname?: string;
  pattern: RegExp;
  type: 'page';
}

export type RouteCache = Record<string, GetStaticPathsResult>;

export type RuntimeMode = 'development' | 'production';

export type RSSFunction = (args: RSSFunctionArgs) => void;

export interface RSSFunctionArgs {
  /** (required) Title of the RSS Feed */
  title: string;
  /** (required) Description of the RSS Feed */
  description: string;
  /** Specify arbitrary metadata on opening <xml> tag */
  xmlns?: Record<string, string>;
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

export type RSSResult = { url: string; xml?: string };

export type ScriptInfo = ScriptInfoInline | ScriptInfoExternal;

export type SSRError = Error & vite.ErrorPayload['err'];

export interface ScriptInfoInline {
  content: string;
}

export interface ScriptInfoExternal {
  src: string;
}
