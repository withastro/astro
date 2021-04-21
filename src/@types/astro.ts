export interface AstroConfigRaw {
  dist: string;
  projectRoot: string;
  astroRoot: string;
  public: string;
  jsx?: string;
}

export type ValidExtensionPlugins = 'astro' | 'react' | 'preact' | 'svelte' | 'vue';

export interface AstroConfig {
  dist: string;
  projectRoot: URL;
  astroRoot: URL;
  public: URL;
  extensions?: Record<string, ValidExtensionPlugins>;
  /** Public URL base (e.g. 'https://mysite.com'). Used in generating sitemaps and canonical URLs. */
  site?: string;
  /** Generate a sitemap? */
  sitemap: boolean;
}

export interface JsxItem {
  name: string;
  jsx: string;
}

export interface TransformResult {
  script: string;
  imports: string[];
  html: string;
  css?: string;
  /** If this page exports a collection, the JS to be executed as a string */
  createCollection?: string;
}

export interface CompileResult {
  result: TransformResult;
  contents: string;
  css?: string;
}

export type RuntimeMode = 'development' | 'production';

export type Params = Record<string, string | number>;

export interface CreateCollection<T = any> {
  data: ({ params }: { params: Params }) => T[];
  routes?: Params[];
  /** tool for generating current page URL */
  permalink?: ({ params }: { params: Params }) => string;
  /** page size */
  pageSize?: number;
}

export interface CollectionResult<T = any> {
  /** result */
  data: T[];

  /** metadata */
  /** the count of the first item on the page, starting from 0 */
  start: number;
  /** the count of the last item on the page, starting from 0 */
  end: number;
  /** total number of results */
  total: number;
  page: {
    /** the current page number, starting from 1 */
    current: number;
    /** number of items per page (default: 25) */
    size: number;
    /** number of last page */
    last: number;
  };
  url: {
    /** url of the current page */
    current: string;
    /** url of the previous page (if there is one) */
    prev?: string;
    /** url of the next page (if there is one) */
    next?: string;
  };
  /** Matched parameters, if any */
  params: Params;
}
