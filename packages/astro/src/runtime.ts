import 'source-map-support/register.js';
import type { LogOptions } from './logger';
import type { AstroConfig, CollectionResult, CollectionRSS, CreateCollection, Params, RuntimeMode } from './@types/astro';

import resolve from 'resolve';
import { existsSync, promises as fs } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { posix as path } from 'path';
import { performance } from 'perf_hooks';
import { SnowpackDevServer, ServerRuntime as SnowpackServerRuntime, SnowpackConfig, NotFoundError } from 'snowpack';
import { CompileError } from 'astro-parser';
import { loadConfiguration, logger as snowpackLogger, startServer as startSnowpackServer } from 'snowpack';
import { canonicalURL, getSrcPath, stopTimer } from './build/util.js';
import { debug, info } from './logger.js';
import { searchForPage } from './search.js';
import snowpackExternals from './external.js';

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
interface CollectionInfo {
  additionalURLs: Set<string>;
  rss?: { data: any[] & CollectionRSS };
}

type LoadResultSuccess = {
  statusCode: 200;
  contents: string | Buffer;
  contentType?: string | false;
};
type LoadResultNotFound = { statusCode: 404; error: Error; collectionInfo?: CollectionInfo };
type LoadResultRedirect = { statusCode: 301 | 302; location: string; collectionInfo?: CollectionInfo };
type LoadResultError = { statusCode: 500 } & ({ type: 'parse-error'; error: CompileError } | { type: 'not-found'; error: CompileError } | { type: 'unknown'; error: Error });

export type LoadResult = (LoadResultSuccess | LoadResultNotFound | LoadResultRedirect | LoadResultError) & { collectionInfo?: CollectionInfo };

// Disable snowpack from writing to stdout/err.
snowpackLogger.level = 'silent';

/** Pass a URL to Astro to resolve and build */
async function load(config: RuntimeConfig, rawPathname: string | undefined): Promise<LoadResult> {
  const { logging, backendSnowpackRuntime, frontendSnowpack } = config;
  const { pages: pagesRoot, buildOptions, devOptions } = config.astroConfig;

  let origin = buildOptions.site ? new URL(buildOptions.site).origin : `http://localhost:${devOptions.port}`;
  const fullurl = new URL(rawPathname || '/', origin);

  const reqPath = decodeURI(fullurl.pathname);
  info(logging, 'access', reqPath);

  const searchResult = searchForPage(fullurl, pagesRoot);
  if (searchResult.statusCode === 404) {
    try {
      const result = await frontendSnowpack.loadUrl(reqPath);
      if (!result) throw new Error(`Unable to load ${reqPath}`);
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
  let rss: { data: any[] & CollectionRSS } = {} as any;

  try {
    const mod = await backendSnowpackRuntime.importModule(snowpackURL);
    debug(logging, 'resolve', `${reqPath} -> ${snowpackURL}`);

    // handle collection
    let collection = {} as CollectionResult;
    let additionalURLs = new Set<string>();

    if (mod.exports.createCollection) {
      const createCollection: CreateCollection = await mod.exports.createCollection();
      for (const key of Object.keys(createCollection)) {
        if (key !== 'data' && key !== 'routes' && key !== 'permalink' && key !== 'pageSize' && key !== 'rss') {
          throw new Error(`[createCollection] unknown option: "${key}"`);
        }
      }
      let { data: loadData, routes, permalink, pageSize, rss: createRSS } = createCollection;
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

      // handle RSS
      if (createRSS) {
        rss = {
          ...createRSS,
          data: [...data] as any,
        };
      }

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
          collectionInfo: {
            additionalURLs,
            rss: rss.data ? rss : undefined,
          },
        };
      }

      // if we’ve paginated too far, this is a 404
      if (!data.length) {
        return {
          statusCode: 404,
          error: new Error('Not Found'),
          collectionInfo: {
            additionalURLs,
            rss: rss.data ? rss : undefined,
          },
        };
      }

      collection.data = data;
    }

    const requestURL = new URL(fullurl.toString());

    // For first release query params are not passed to components.
    // An exception is made for dev server specific routes.
    if (reqPath !== '/500') {
      requestURL.search = '';
    }

    let html = (await mod.exports.__renderPage({
      request: {
        // params should go here when implemented
        url: requestURL,
        canonicalURL: canonicalURL(requestURL.pathname, requestURL.origin),
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
      collectionInfo: {
        additionalURLs,
        rss: rss.data ? rss : undefined,
      },
    };
  } catch (err) {
    if (err.code === 'parse-error' || err instanceof SyntaxError) {
      return {
        statusCode: 500,
        type: 'parse-error',
        error: err,
      };
    }

    if (err instanceof NotFoundError && rawPathname) {
      const fileMatch = err.toString().match(/\(([^\)]+)\)/);
      const missingFile: string | undefined = (fileMatch && fileMatch[1].replace(/^\/_astro/, '').replace(/\.proxy\.js$/, '')) || undefined;
      const distPath = path.extname(rawPathname) ? rawPathname : rawPathname.replace(/\/?$/, '/index.html');
      const srcFile = getSrcPath(distPath, { astroConfig: config.astroConfig });
      const code = existsSync(srcFile) ? await fs.readFile(srcFile, 'utf8') : '';

      // try and find the import statement within the module. this is a bit hacky, as we don’t know the line, but
      // given that we know this is for sure a “not found” error, and we know what file is erring,
      // we can make some safe assumptions about how to locate the line in question
      let start = 0;
      const segments = missingFile ? missingFile.split('/').filter((segment) => !!segment) : [];
      while (segments.length) {
        const importMatch = code.indexOf(segments.join('/'));
        if (importMatch >= 0) {
          start = importMatch;
          break;
        }
        segments.shift();
      }

      return {
        statusCode: 500,
        type: 'not-found',
        error: new CompileError({
          code,
          filename: srcFile.pathname,
          start,
          message: `Could not find${missingFile ? ` "${missingFile}"` : ' file'}`,
        }),
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

interface CreateSnowpackOptions {
  env: Record<string, any>;
  mode: RuntimeMode;
  resolvePackageUrl?: (pkgName: string) => Promise<string>;
  target: 'frontend' | 'backend';
}

const DEFAULT_HMR_PORT = 12321;
const DEFAULT_RENDERERS = ['@astrojs/renderer-vue', '@astrojs/renderer-svelte', '@astrojs/renderer-react', '@astrojs/renderer-preact'];

/** Create a new Snowpack instance to power Astro */
async function createSnowpack(astroConfig: AstroConfig, options: CreateSnowpackOptions) {
  const { projectRoot, pages: pagesRoot, renderers = DEFAULT_RENDERERS } = astroConfig;
  const { env, mode, resolvePackageUrl, target } = options;

  const internalPath = new URL('./frontend/', import.meta.url);
  const resolveDependency = (dep: string) => resolve.sync(dep, { basedir: fileURLToPath(projectRoot) });
  const isHmrEnabled = mode === 'development' && target === 'backend';

  let snowpack: SnowpackDevServer;
  let astroPluginOptions: {
    resolvePackageUrl?: (s: string) => Promise<string>;
    renderers?: { name: string; client: string; server: string }[];
    astroConfig: AstroConfig;
    hmrPort?: number;
  } = {
    astroConfig,
    resolvePackageUrl,
    hmrPort: isHmrEnabled ? DEFAULT_HMR_PORT : undefined,
  };

  const mountOptions = {
    [fileURLToPath(pagesRoot)]: '/_astro/pages',
    ...(existsSync(astroConfig.public) ? { [fileURLToPath(astroConfig.public)]: '/' } : {}),
    [fileURLToPath(internalPath)]: '/_astro_internal',
    [fileURLToPath(projectRoot)]: '/_astro', // must be last (greediest)
  };

  // Tailwind: IDK what this does but it makes JIT work 🤷‍♂️
  if (astroConfig.devOptions.tailwindConfig) {
    (process.env as any).TAILWIND_DISABLE_TOUCH = true;
  }

  const rendererInstances = (
    await Promise.all(
      renderers.map((renderer) => {
        const entrypoint = pathToFileURL(resolveDependency(renderer)).toString();
        return import(entrypoint);
      })
    )
  ).map(({ default: raw }, i) => {
    const { name = renderers[i], client, server, snowpackPlugin: snowpackPluginName, snowpackPluginOptions } = raw;

    if (typeof client !== 'string') {
      throw new Error(`Expected "client" from ${name} to be a relative path to the client-side renderer!`);
    }

    if (typeof server !== 'string') {
      throw new Error(`Expected "server" from ${name} to be a relative path to the server-side renderer!`);
    }

    let snowpackPlugin: string | [string, any] | undefined;
    if (typeof snowpackPluginName === 'string') {
      if (snowpackPluginOptions) {
        snowpackPlugin = [resolveDependency(snowpackPluginName), snowpackPluginOptions];
      } else {
        snowpackPlugin = resolveDependency(snowpackPluginName);
      }
    } else if (snowpackPluginName) {
      throw new Error(`Expected the snowpackPlugin from ${name} to be a "string" but encountered "${typeof snowpackPluginName}"!`);
    }

    return {
      name,
      snowpackPlugin,
      client: path.join(name, raw.client),
      server: path.join(name, raw.server),
    };
  });

  astroPluginOptions.renderers = rendererInstances;

  // Make sure that Snowpack builds our renderer plugins
  const knownEntrypoints = [].concat(...(rendererInstances.map((renderer) => [renderer.server, renderer.client]) as any));
  const rendererSnowpackPlugins = rendererInstances.filter((renderer) => renderer.snowpackPlugin).map((renderer) => renderer.snowpackPlugin) as string | [string, any];

  const snowpackConfig = await loadConfiguration({
    root: fileURLToPath(projectRoot),
    mount: mountOptions,
    mode,
    plugins: [
      [fileURLToPath(new URL('../snowpack-plugin.cjs', import.meta.url)), astroPluginOptions],
      ...rendererSnowpackPlugins,
      resolveDependency('@snowpack/plugin-sass'),
      [
        resolveDependency('@snowpack/plugin-postcss'),
        {
          config: {
            plugins: {
              [resolveDependency('autoprefixer')]: {},
              ...(astroConfig.devOptions.tailwindConfig ? { [resolveDependency('autoprefixer')]: {} } : {}),
            },
          },
        },
      ],
    ],
    devOptions: {
      open: 'none',
      output: 'stream',
      port: 0,
      hmr: isHmrEnabled,
      hmrPort: isHmrEnabled ? DEFAULT_HMR_PORT : undefined,
      tailwindConfig: astroConfig.devOptions.tailwindConfig,
    },
    buildOptions: {
      out: astroConfig.dist,
    },
    packageOptions: {
      knownEntrypoints,
      external: snowpackExternals,
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
  const timer: Record<string, number> = {};
  const resolvePackageUrl = async (pkgName: string) => frontendSnowpack.getUrlForPackage(pkgName);

  timer.backend = performance.now();
  const {
    snowpack: backendSnowpack,
    snowpackRuntime: backendSnowpackRuntime,
    snowpackConfig: backendSnowpackConfig,
  } = await createSnowpack(astroConfig, {
    target: 'backend',
    env: {
      astro: true,
    },
    mode,
    resolvePackageUrl,
  });
  debug(logging, 'core', `backend snowpack created [${stopTimer(timer.backend)}]`);

  timer.frontend = performance.now();
  const {
    snowpack: frontendSnowpack,
    snowpackRuntime: frontendSnowpackRuntime,
    snowpackConfig: frontendSnowpackConfig,
  } = await createSnowpack(astroConfig, {
    target: 'frontend',
    env: {
      astro: false,
    },
    mode,
  });
  debug(logging, 'core', `frontend snowpack created [${stopTimer(timer.frontend)}]`);

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
