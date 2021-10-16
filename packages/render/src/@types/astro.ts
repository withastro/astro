import type { AstroComponentFactory } from '../internal';

export interface AstroComponentMetadata {
  displayName: string;
  hydrate?: 'load' | 'idle' | 'visible' | 'media' | 'only';
  hydrateArgs?: any;
  componentUrl?: string;
  componentExport?: { value: string; namespace?: boolean };
}

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

export type JSXTransformFn = (options: { isSSR: boolean }) => Promise<JSXTransformConfig>;

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
  polyfills?: string[];
  /** Utilies for server-side rendering */
  ssr: {
    check: AsyncRendererComponentFn<boolean>;
    renderToStaticMarkup: AsyncRendererComponentFn<{
      html: string;
    }>;
  };
}

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

export interface ScriptInfoInline {
  content: string;
}

export interface ScriptInfoExternal {
  src: string;
}
