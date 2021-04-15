import { fileURLToPath } from 'url';
import type { SnowpackDevServer, ServerRuntime as SnowpackServerRuntime, SnowpackConfig } from 'snowpack';
import type { AstroConfig, CollectionResult, CreateCollection, Params, RuntimeMode } from './@types/astro';
import type { LogOptions } from './logger';
import type { CompileError } from './parser/utils/error.js';
import { debug, info } from './logger.js';
import { searchForPage } from './search.js';

import { existsSync } from 'fs';
import { loadConfiguration, logger as snowpackLogger, startServer as startSnowpackServer } from 'snowpack';

// We need to use require.resolve for snowpack plugins, so create a require function here.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

interface RuntimeConfig {
  astroConfig: AstroConfig;
  logging: LogOptions;
  mode: RuntimeMode;
  backendSnowpack: SnowpackDevServer;
  backendSnowpackRuntime: SnowpackServerRuntime;
  backendSnowpackConfig: SnowpackConfig;
  frontendSnowpack: SnowpackDevServer;
  frontendSnowpackRuntime: SnowpackServerRuntime;
  frontendSnowpackConfig: SnowpackConfig;
}

// info needed for collection generation
type CollectionInfo = { additionalURLs: Set<string> };

type LoadResultSuccess = {
  statusCode: 200;
  contents: string | Buffer;
  contentType?: string | false;
};
type LoadResultNotFound = { statusCode: 404; error: Error; collectionInfo?: CollectionInfo };
type LoadResultRedirect = { statusCode: 301 | 302; location: string; collectionInfo?: CollectionInfo };
type LoadResultError = { statusCode: 500 } & ({ type: 'parse-error'; error: CompileError } | { type: 'unknown'; error: Error });

export type LoadResult = (LoadResultSuccess | LoadResultNotFound | LoadResultRedirect | LoadResultError) & { collectionInfo?: CollectionInfo };

// Disable snowpack from writing to stdout/err.
snowpackLogger.level = 'silent';

/** Pass a URL to Astro to resolve and build */
async function load(config: RuntimeConfig, rawPathname: string | undefined): Promise<LoadResult> {
  const { logging, backendSnowpackRuntime, frontendSnowpack } = config;
  const { astroRoot } = config.astroConfig;

  const fullurl = new URL(rawPathname || '/', 'https://example.org/');

  const reqPath = decodeURI(fullurl.pathname);
  info(logging, 'access', reqPath);

  const searchResult = searchForPage(fullurl, astroRoot);
  if (searchResult.statusCode === 404) {
    try {
      const result = await frontendSnowpack.loadUrl(reqPath);

      // success
      return {
        statusCode: 200,
        ...result,
      };
    } catch (err) {
      // build error
      if (err.failed) {
        return { statusCode: 500, type: 'unknown', error: err };
      }

      // not found
      return { statusCode: 404, error: err };
    }
  }

  if (searchResult.statusCode === 301) {
    return { statusCode: 301, location: searchResult.pathname };
  }

  const snowpackURL = searchResult.location.snowpackURL;

  try {
    const mod = await backendSnowpackRuntime.importModule(snowpackURL);
    debug(logging, 'resolve', `${reqPath} -> ${snowpackURL}`);

    // handle collection
    let collection = {} as CollectionResult;
    let additionalURLs = new Set<string>();

    if (mod.exports.createCollection) {
      const createCollection: CreateCollection = await mod.exports.createCollection();
      for (const key of Object.keys(createCollection)) {
        if (key !== 'data' && key !== 'routes' && key !== 'permalink' && key !== 'pageSize') {
          throw new Error(`[createCollection] unknown option: "${key}"`);
        }
      }
      let { data: loadData, routes, permalink, pageSize } = createCollection;
      if (!pageSize) pageSize = 25; // can’t be 0
      let currentParams: Params = {};

      // params
      if (routes || permalink) {
        if (!routes || !permalink) {
          throw new Error('createCollection() must have both routes and permalink options. Include both together, or omit both.');
        }
        let requestedParams = routes.find((p) => {
          const baseURL = (permalink as any)({ params: p });
          additionalURLs.add(baseURL);
          return baseURL === reqPath || `${baseURL}/${searchResult.currentPage || 1}` === reqPath;
        });
        if (requestedParams) {
          currentParams = requestedParams;
          collection.params = requestedParams;
        }
      }

      let data: any[] = await loadData({ params: currentParams });

      collection.start = 0;
      collection.end = data.length - 1;
      collection.total = data.length;
      collection.page = { current: 1, size: pageSize, last: 1 };
      collection.url = { current: reqPath };

      // paginate
      if (searchResult.currentPage) {
        const start = (searchResult.currentPage - 1) * pageSize; // currentPage is 1-indexed
        const end = Math.min(start + pageSize, data.length);

        collection.start = start;
        collection.end = end - 1;
        collection.page.current = searchResult.currentPage;
        collection.page.last = Math.ceil(data.length / pageSize);
        // TODO: fix the .replace() hack
        if (end < data.length) {
          collection.url.next = collection.url.current.replace(/(\/\d+)?$/, `/${searchResult.currentPage + 1}`);
        }
        if (searchResult.currentPage > 1) {
          collection.url.prev = collection.url.current
            .replace(/\d+$/, `${searchResult.currentPage - 1 || 1}`) // update page #
            .replace(/\/1$/, ''); // if end is `/1`, then just omit
        }

        // from page 2 to the end, add all pages as additional URLs (needed for build)
        for (let n = 1; n <= collection.page.last; n++) {
          if (additionalURLs.size) {
            // if this is a param-based collection, paginate all params
            additionalURLs.forEach((url) => {
              additionalURLs.add(url.replace(/(\/\d+)?$/, `/${n}`));
            });
          } else {
            // if this has no params, simply add page
            additionalURLs.add(reqPath.replace(/(\/\d+)?$/, `/${n}`));
          }
        }

        data = data.slice(start, end);
      } else if (createCollection.pageSize) {
        // TODO: fix bug where redirect doesn’t happen
        // This happens because a pageSize is set, but the user isn’t on a paginated route. Redirect:
        return {
          statusCode: 301,
          location: reqPath + '/1',
          collectionInfo: additionalURLs.size ? { additionalURLs } : undefined,
        };
      }

      // if we’ve paginated too far, this is a 404
      if (!data.length) {
        return {
          statusCode: 404,
          error: new Error('Not Found'),
          collectionInfo: additionalURLs.size ? { additionalURLs } : undefined,
        };
      }

      collection.data = data;
    }

    let html = (await mod.exports.__renderPage({
      request: {
        host: fullurl.hostname,
        path: fullurl.pathname,
        href: fullurl.toString(),
      },
      children: [],
      props: { collection },
    })) as string;

    // inject styles
    // TODO: handle this in compiler
    const styleTags = Array.isArray(mod.css) && mod.css.length ? mod.css.reduce((markup, href) => `${markup}\n<link rel="stylesheet" type="text/css" href="${href}" />`, '') : ``;
    if (html.indexOf('</head>') !== -1) {
      html = html.replace('</head>', `${styleTags}</head>`);
    } else {
      html = styleTags + html;
    }

    return {
      statusCode: 200,
      contentType: 'text/html; charset=utf-8',
      contents: html,
      collectionInfo: additionalURLs.size ? { additionalURLs } : undefined,
    };
  } catch (err) {
    if (err.code === 'parse-error') {
      return {
        statusCode: 500,
        type: 'parse-error',
        error: err,
      };
    }
    return {
      statusCode: 500,
      type: 'unknown',
      error: err,
    };
  }
}

export interface AstroRuntime {
  runtimeConfig: RuntimeConfig;
  load: (rawPathname: string | undefined) => Promise<LoadResult>;
  shutdown: () => Promise<void>;
}

interface RuntimeOptions {
  mode: RuntimeMode;
  logging: LogOptions;
}

/** Create a new Snowpack instance to power Astro */
async function createSnowpack(astroConfig: AstroConfig, env: Record<string, any>, mode: RuntimeMode) {
  const { projectRoot, astroRoot, extensions } = astroConfig;

  const internalPath = new URL('./frontend/', import.meta.url);

  let snowpack: SnowpackDevServer;
  const astroPlugOptions: {
    resolve?: (s: string) => Promise<string>;
    extensions?: Record<string, string>;
    astroConfig: AstroConfig;
  } = {
    astroConfig,
    extensions,
    resolve: async (pkgName: string) => snowpack.getUrlForPackage(pkgName),
  };

  const mountOptions = {
    [fileURLToPath(astroRoot)]: '/_astro',
    [fileURLToPath(internalPath)]: '/_astro_internal',
  };

  if (existsSync(astroConfig.public)) {
    mountOptions[fileURLToPath(astroConfig.public)] = '/';
  }

  const snowpackConfig = await loadConfiguration({
    root: fileURLToPath(projectRoot),
    mount: mountOptions,
    mode: mode,
    plugins: [
      [fileURLToPath(new URL('../snowpack-plugin.cjs', import.meta.url)), astroPlugOptions],
      require.resolve('@snowpack/plugin-sass'),
      [require.resolve('@snowpack/plugin-svelte'), { compilerOptions: { hydratable: true } }],
      require.resolve('@snowpack/plugin-vue'),
    ],
    devOptions: {
      open: 'none',
      output: 'stream',
      port: 0,
    },
    buildOptions: {
      out: astroConfig.dist,
    },
    packageOptions: {
      knownEntrypoints: ['preact-render-to-string'],
      external: ['@vue/server-renderer', 'node-fetch', 'prismjs/components/index.js'],
    },
  });

  const envConfig = snowpackConfig.env || (snowpackConfig.env = {});
  Object.assign(envConfig, env);

  snowpack = await startSnowpackServer({
    config: snowpackConfig,
    lockfile: null,
  });
  const snowpackRuntime = snowpack.getServerRuntime();

  return { snowpack, snowpackRuntime, snowpackConfig };
}

/** Core Astro runtime */
export async function createRuntime(astroConfig: AstroConfig, { mode, logging }: RuntimeOptions): Promise<AstroRuntime> {
  const { snowpack: backendSnowpack, snowpackRuntime: backendSnowpackRuntime, snowpackConfig: backendSnowpackConfig } = await createSnowpack(astroConfig, {
    astro: true,
  }, mode);

  const { snowpack: frontendSnowpack, snowpackRuntime: frontendSnowpackRuntime, snowpackConfig: frontendSnowpackConfig } = await createSnowpack(astroConfig, {
    astro: false,
  }, mode);

  const runtimeConfig: RuntimeConfig = {
    astroConfig,
    logging,
    mode,
    backendSnowpack,
    backendSnowpackRuntime,
    backendSnowpackConfig,
    frontendSnowpack,
    frontendSnowpackRuntime,
    frontendSnowpackConfig,
  };

  return {
    runtimeConfig,
    load: load.bind(null, runtimeConfig),
    shutdown: () => Promise.all([backendSnowpack.shutdown(), frontendSnowpack.shutdown()]).then(() => void 0),
  };
}
