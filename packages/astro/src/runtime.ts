import 'source-map-support/register.js';
import type { LogOptions } from './logger';
import type { AstroConfig, CollectionResult, CollectionRSS, CreateCollection, Params, RuntimeMode } from './@types/astro';

import resolve from 'resolve';
import { existsSync, promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { posix as path } from 'path';
import { performance } from 'perf_hooks';
import {
  loadConfiguration,
  logger as snowpackLogger,
  NotFoundError,
  SnowpackDevServer,
  ServerRuntime as SnowpackServerRuntime,
  SnowpackConfig,
  startServer as startSnowpackServer,
} from 'snowpack';
import { CompileError } from '@astrojs/parser';
import { canonicalURL, getSrcPath, stopTimer } from './build/util.js';
import { debug, info } from './logger.js';
import { configureSnowpackLogger } from './snowpack-logger.js';
import { searchForPage } from './search.js';
import snowpackExternals from './external.js';
import { ConfigManager } from './config_manager.js';

interface RuntimeConfig {
  astroConfig: AstroConfig;
  logging: LogOptions;
  mode: RuntimeMode;
  snowpack: SnowpackDevServer;
  snowpackRuntime: SnowpackServerRuntime;
  snowpackConfig: SnowpackConfig;
  configManager: ConfigManager;
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
configureSnowpackLogger(snowpackLogger);

/** Pass a URL to Astro to resolve and build */
async function load(config: RuntimeConfig, rawPathname: string | undefined): Promise<LoadResult> {
  const { logging, snowpackRuntime, snowpack, configManager } = config;
  const { buildOptions, devOptions } = config.astroConfig;

  let origin = buildOptions.site ? new URL(buildOptions.site).origin : `http://localhost:${devOptions.port}`;
  const fullurl = new URL(rawPathname || '/', origin);

  const reqPath = decodeURI(fullurl.pathname);
  info(logging, 'access', reqPath);

  const searchResult = searchForPage(fullurl, config.astroConfig);
  if (searchResult.statusCode === 404) {
    try {
      const result = await snowpack.loadUrl(reqPath);
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
    if (configManager.needsUpdate()) {
      await configManager.update();
    }
    const mod = await snowpackRuntime.importModule(snowpackURL);
    debug(logging, 'resolve', `${reqPath} -> ${snowpackURL}`);

    // handle collection
    let collection = {} as CollectionResult;
    let additionalURLs = new Set<string>();

    if (mod.exports.createCollection) {
      const createCollection: CreateCollection = await mod.exports.createCollection();
      const VALID_KEYS = new Set(['data', 'routes', 'permalink', 'pageSize', 'rss']);
      for (const key of Object.keys(createCollection)) {
        if (!VALID_KEYS.has(key)) {
          throw new Error(`[createCollection] unknown option: "${key}". Expected one of ${[...VALID_KEYS].join(', ')}.`);
        }
      }
      let { data: loadData, routes, permalink, pageSize, rss: createRSS } = createCollection;
      if (!loadData) throw new Error(`[createCollection] must return \`data()\` function to create a collection.`);
      if (!pageSize) pageSize = 25; // can’t be 0
      let currentParams: Params = {};

      // params
      if (routes || permalink) {
        if (!routes) throw new Error('[createCollection] `permalink` requires `routes` as well.');
        if (!permalink) throw new Error('[createCollection] `routes` requires `permalink` as well.');

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
      if (!data) throw new Error(`[createCollection] \`data()\` returned nothing (empty data)"`);
      if (!Array.isArray(data)) data = [data]; // note: this is supposed to be a little friendlier to the user, but should we error out instead?

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
      css: Array.isArray(mod.css) ? mod.css : typeof mod.css === 'string' ? [mod.css] : [],
    })) as string;

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

export interface RuntimeOptions {
  mode: RuntimeMode;
  logging: LogOptions;
}

interface CreateSnowpackOptions {
  mode: RuntimeMode;
  resolvePackageUrl: (pkgName: string) => Promise<string>;
}

/** Create a new Snowpack instance to power Astro */
async function createSnowpack(astroConfig: AstroConfig, options: CreateSnowpackOptions) {
  const { projectRoot, src } = astroConfig;
  const { mode, resolvePackageUrl } = options;

  const frontendPath = new URL('./frontend/', import.meta.url);
  const resolveDependency = (dep: string) => resolve.sync(dep, { basedir: fileURLToPath(projectRoot) });
  const isHmrEnabled = mode === 'development';

  // The config manager takes care of the runtime config module (that handles setting renderers, mostly)
  const configManager = new ConfigManager(astroConfig, resolvePackageUrl);

  let snowpack: SnowpackDevServer;
  let astroPluginOptions: {
    resolvePackageUrl?: (s: string) => Promise<string>;
    astroConfig: AstroConfig;
    hmrPort?: number;
    mode: RuntimeMode;
    configManager: ConfigManager;
  } = {
    astroConfig,
    mode,
    resolvePackageUrl,
    configManager,
  };

  const mountOptions = {
    ...(existsSync(astroConfig.public) ? { [fileURLToPath(astroConfig.public)]: '/' } : {}),
    [fileURLToPath(frontendPath)]: '/_astro_frontend',
    [fileURLToPath(src)]: '/_astro/src', // must be last (greediest)
  };

  // Tailwind: IDK what this does but it makes JIT work 🤷‍♂️
  if (astroConfig.devOptions.tailwindConfig) {
    (process.env as any).TAILWIND_DISABLE_TOUCH = true;
  }

  // Make sure that Snowpack builds our renderer plugins
  const rendererInstances = await configManager.buildRendererInstances();
  const knownEntrypoints: string[] = ['astro/dist/internal/__astro_component.js'];
  for (const renderer of rendererInstances) {
    knownEntrypoints.push(renderer.server, renderer.client);
    if (renderer.knownEntrypoints) {
      knownEntrypoints.push(...renderer.knownEntrypoints);
    }
  }
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
              ...(astroConfig.devOptions.tailwindConfig ? { [resolveDependency('tailwindcss')]: astroConfig.devOptions.tailwindConfig } : {}),
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
      tailwindConfig: astroConfig.devOptions.tailwindConfig,
    },
    buildOptions: {
      baseUrl: astroConfig.buildOptions.site || '/', // note: Snowpack needs this fallback
      out: astroConfig.dist,
    },
    packageOptions: {
      knownEntrypoints,
      external: snowpackExternals,
    },
  });

  snowpack = await startSnowpackServer(
    {
      config: snowpackConfig,
      lockfile: null,
    },
    {
      isWatch: mode === 'development',
    }
  );
  const snowpackRuntime = snowpack.getServerRuntime();
  astroPluginOptions.configManager.snowpackRuntime = snowpackRuntime;

  return { snowpack, snowpackRuntime, snowpackConfig, configManager };
}

/** Core Astro runtime */
export async function createRuntime(astroConfig: AstroConfig, { mode, logging }: RuntimeOptions): Promise<AstroRuntime> {
  let snowpack: SnowpackDevServer;
  const timer: Record<string, number> = {};
  const resolvePackageUrl = async (pkgName: string) => snowpack.getUrlForPackage(pkgName);

  timer.backend = performance.now();
  const {
    snowpack: snowpackInstance,
    snowpackRuntime,
    snowpackConfig,
    configManager,
  } = await createSnowpack(astroConfig, {
    mode,
    resolvePackageUrl,
  });
  snowpack = snowpackInstance;
  debug(logging, 'core', `snowpack created [${stopTimer(timer.backend)}]`);

  const runtimeConfig: RuntimeConfig = {
    astroConfig,
    logging,
    mode,
    snowpack,
    snowpackRuntime,
    snowpackConfig,
    configManager,
  };

  return {
    runtimeConfig,
    load: load.bind(null, runtimeConfig),
    shutdown: () => snowpack.shutdown(),
  };
}
