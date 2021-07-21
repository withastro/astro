import type { AstroConfig, PaginatedCollectionResult, CollectionRSS, CreateCollectionResult, PaginateFunction, RuntimeMode } from './@types/astro';
import type { CompileError as ICompileError } from '@astrojs/parser';

import { compile as compilePathToRegexp, match as matchPathToRegexp } from 'path-to-regexp';
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
import parser from '@astrojs/parser';
const { CompileError } = parser;
import { canonicalURL, getSrcPath, stopTimer } from './build/util.js';
import { LogOptions, debug, info, warn } from './logger.js';
import { configureSnowpackLogger } from './snowpack-logger.js';
import { searchForPage } from './search.js';
import snowpackExternals from './external.js';
import { nodeBuiltinsMap } from './node_builtins.js';
import { ConfigManager } from './config_manager.js';
import { validateCollectionModule, validateCollectionResult } from './util.js';

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
  collectionInfo?: CollectionInfo;
};
type LoadResultNotFound = { statusCode: 404; error: Error };
type LoadResultRedirect = { statusCode: 301 | 302; location: string };
type LoadResultError = { statusCode: 500 } & (
  | { type: 'parse-error'; error: ICompileError }
  | { type: 'ssr'; error: Error }
  | { type: 'not-found'; error: ICompileError }
  | { type: 'unknown'; error: Error }
);

export type LoadResult = LoadResultSuccess | LoadResultNotFound | LoadResultRedirect | LoadResultError;

// Disable snowpack from writing to stdout/err.
configureSnowpackLogger(snowpackLogger);

/** Pass a URL to Astro to resolve and build */
async function load(config: RuntimeConfig, rawPathname: string | undefined): Promise<LoadResult> {
  const { logging, snowpackRuntime, snowpack, configManager } = config;
  const { buildOptions, devOptions } = config.astroConfig;

  let origin = buildOptions.site ? new URL(buildOptions.site).origin : `http://${devOptions.hostname}:${devOptions.port}`;
  const fullurl = new URL(rawPathname || '/', origin);

  const reqPath = decodeURI(fullurl.pathname);
  info(logging, 'access', reqPath);

  const searchResult = await searchForPage(fullurl, config.astroConfig);
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
  let collectionInfo: CollectionInfo | undefined;
  let pageProps = {} as Record<string, any>;

  try {
    if (configManager.needsUpdate()) {
      await configManager.update();
    }
    const mod = await snowpackRuntime.importModule(snowpackURL);
    debug(logging, 'resolve', `${reqPath} -> ${snowpackURL}`);

    // If this URL matched a collection, run the createCollection() function.
    // TODO(perf): The createCollection() function is meant to be run once, but right now
    // it re-runs on every new page load. This is especially problematic during build.
    if (path.posix.basename(searchResult.location.fileURL.pathname).startsWith('$')) {
      validateCollectionModule(mod, searchResult.pathname);
      const pageCollection: CreateCollectionResult = await mod.exports.createCollection();
      validateCollectionResult(pageCollection, searchResult.pathname);
      const { route, paths: getPaths = () => [{ params: {} }], props: getProps, paginate: isPaginated, rss: createRSS } = pageCollection;
      debug(logging, 'collection', `use route "${route}" to match request "${reqPath}"`);
      const reqToParams = matchPathToRegexp<any>(route);
      const toPath = compilePathToRegexp(route);
      const reqParams = reqToParams(reqPath);
      if (!reqParams) {
        throw new Error(`[createCollection] route pattern does not match request: "${route}". (${searchResult.pathname})`);
      }
      if (isPaginated && reqParams.params.page === '1') {
        return { statusCode: 404, error: new Error(`[createCollection] The first page of a paginated collection has no page number in the URL. (${searchResult.pathname})`) };
      }
      const pageNum = parseInt(reqParams.params.page || 1);
      const allPaths = getPaths();
      const matchedPathObject = allPaths.find((p) => toPath({ ...p.params, page: reqParams.params.page }) === reqPath);
      debug(logging, 'collection', `matched path: ${JSON.stringify(matchedPathObject)}`);
      if (!matchedPathObject) {
        throw new Error(`[createCollection] no matching path found: "${route}". (${searchResult.pathname})`);
      }
      const matchedParams = matchedPathObject.params;
      if (matchedParams.page) {
        throw new Error(`[createCollection] "page" param is reserved for pagination and handled for you by Astro. It cannot be returned by "paths()". (${searchResult.pathname})`);
      }
      let paginateUtility: PaginateFunction = () => {
        throw new Error(`[createCollection] paginate() function was called but "paginate: true" was not set. (${searchResult.pathname})`);
      };
      let lastPage: number | undefined;
      let paginateCallCount: number | undefined;
      if (isPaginated) {
        paginateCallCount = 0;
        paginateUtility = (data, args = {}) => {
          paginateCallCount!++;
          let { pageSize } = args;
          if (!pageSize) {
            pageSize = 10;
          }
          const start = pageSize === Infinity ? 0 : (pageNum - 1) * pageSize; // currentPage is 1-indexed
          const end = Math.min(start + pageSize, data.length);
          lastPage = Math.max(1, Math.ceil(data.length / pageSize));
          // The first page of any collection should generate a collectionInfo
          // metadata object. Important for the final build.
          if (pageNum === 1) {
            collectionInfo = {
              additionalURLs: new Set<string>(),
              rss: undefined,
            };
            if (createRSS) {
              collectionInfo.rss = {
                ...createRSS,
                data: [...data] as any,
              };
            }
            for (const page of [...Array(lastPage - 1).keys()]) {
              collectionInfo.additionalURLs.add(toPath({ ...matchedParams, page: page + 2 }));
            }
          }
          return {
            data: data.slice(start, end),
            start,
            end: end - 1,
            total: data.length,
            page: {
              size: pageSize,
              current: pageNum,
              last: lastPage,
            },
            url: {
              current: reqPath,
              next: pageNum === lastPage ? undefined : toPath({ ...matchedParams, page: pageNum + 1 }),
              prev: pageNum === 1 ? undefined : toPath({ ...matchedParams, page: pageNum - 1 === 1 ? undefined : pageNum - 1 }),
            },
          } as PaginatedCollectionResult;
        };
      }
      pageProps = await getProps({ params: matchedParams, paginate: paginateUtility });
      debug(logging, 'collection', `page props: ${JSON.stringify(pageProps)}`);
      if (paginateCallCount !== undefined && paginateCallCount !== 1) {
        throw new Error(
          `[createCollection] paginate() function must be called 1 time when "paginate: true". Called ${paginateCallCount} times instead. (${searchResult.pathname})`
        );
      }
      if (lastPage !== undefined && pageNum > lastPage) {
        return { statusCode: 404, error: new Error(`[createCollection] page ${pageNum} does not exist. Available pages: 1-${lastPage} (${searchResult.pathname})`) };
      }
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
      props: pageProps,
      css: Array.isArray(mod.css) ? mod.css : typeof mod.css === 'string' ? [mod.css] : [],
    })) as string;

    return {
      statusCode: 200,
      contentType: 'text/html; charset=utf-8',
      contents: html,
      collectionInfo,
    };
  } catch (err) {
    if (err.code === 'parse-error' || err instanceof SyntaxError) {
      return {
        statusCode: 500,
        type: 'parse-error',
        error: err,
      };
    }

    if (err instanceof ReferenceError && err.toString().includes('window is not defined')) {
      return {
        statusCode: 500,
        type: 'ssr',
        error: new Error(
          `[${reqPath}]
    The window object is not available during server-side rendering (SSR).
    Try using \`import.meta.env.SSR\` to write SSR-friendly code.
    https://docs.astro.build/reference/api-reference/#importmeta`
        ),
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
  const knownEntrypoints: string[] = ['astro/dist/internal/__astro_component.js', 'astro/dist/internal/element-registry.js'];
  for (const renderer of rendererInstances) {
    knownEntrypoints.push(renderer.server);
    if (renderer.client) {
      knownEntrypoints.push(renderer.client);
    }
    if (renderer.knownEntrypoints) {
      knownEntrypoints.push(...renderer.knownEntrypoints);
    }
    knownEntrypoints.push(...renderer.polyfills);
    knownEntrypoints.push(...renderer.hydrationPolyfills);
  }
  const external = snowpackExternals.concat([]);
  for (const renderer of rendererInstances) {
    if (renderer.external) {
      external.push(...renderer.external);
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
      external,
    },
  });

  const polyfillNode = (snowpackConfig.packageOptions as any).polyfillNode as boolean;
  if (!polyfillNode) {
    snowpackConfig.alias = Object.assign({}, Object.fromEntries(nodeBuiltinsMap), snowpackConfig.alias ?? {});
  }

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

interface PageLocation {
  fileURL: URL;
  snowpackURL: string;
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
