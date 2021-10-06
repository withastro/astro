import type { CompileError as ICompileError } from '@astrojs/parser';
import parser from '@astrojs/parser';
import { existsSync, promises as fs } from 'fs';
import { posix as path } from 'path';
import { performance } from 'perf_hooks';
import resolve from 'resolve';
import {
  loadConfiguration,
  logger as snowpackLogger,
  NotFoundError,
  ServerRuntime as SnowpackServerRuntime,
  SnowpackConfig,
  SnowpackDevServer,
  startServer as startSnowpackServer,
} from 'snowpack';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import type { AstroConfig, GetStaticPathsArgs, GetStaticPathsResult, ManifestData, Params, RSSFunctionArgs, RuntimeMode } from './@types/astro';
import { generatePaginateFunction } from './build/paginate.js';
import { canonicalURL, getSrcPath, stopTimer } from './build/util.js';
import { formatConfigError } from './config.js';
import { ConfigManager } from './config_manager.js';
import snowpackExternals from './external.js';
import { debug, info, LogOptions } from './logger.js';
import { createManifest } from './manifest/create.js';
import { nodeBuiltinsMap } from './node_builtins.js';
import { configureSnowpackLogger } from './snowpack-logger.js';
import { convertMatchToLocation, validateGetStaticPathsModule, validateGetStaticPathsResult } from './util.js';

const { CompileError } = parser;

export interface AstroRuntimeConfig {
  astroConfig: AstroConfig;
  cache: { staticPaths: Record<string, GetStaticPathsResult> };
  logging: LogOptions;
  mode: RuntimeMode;
  snowpack: SnowpackDevServer;
  snowpackRuntime: SnowpackServerRuntime;
  snowpackConfig: SnowpackConfig;
  configManager: ConfigManager;
  manifest: ManifestData;
}

type LoadResultSuccess = {
  statusCode: 200;
  contents: string | Buffer;
  contentType?: string | false;
  rss?: { data: any[] & RSSFunctionArgs };
};
type LoadResultNotFound = { statusCode: 404; error: Error };
type LoadResultError = { statusCode: 500 } & (
  | { type: 'parse-error'; error: ICompileError }
  | { type: 'config-error'; error: z.ZodError }
  | { type: 'ssr'; error: Error }
  | { type: 'not-found'; error: ICompileError }
  | { type: 'unknown'; error: Error }
);

export type LoadResult = LoadResultSuccess | LoadResultNotFound | LoadResultError;

// Disable snowpack from writing to stdout/err.
configureSnowpackLogger(snowpackLogger);

function getParams(array: string[]) {
  // given an array of params like `['x', 'y', 'z']` for
  // src/routes/[x]/[y]/[z]/svelte, create a function
  // that turns a RegExpExecArray into ({ x, y, z })
  const fn = (match: RegExpExecArray) => {
    const params: Params = {};
    array.forEach((key, i) => {
      if (key.startsWith('...')) {
        params[key.slice(3)] = match[i + 1] ? decodeURIComponent(match[i + 1]) : undefined;
      } else {
        params[key] = decodeURIComponent(match[i + 1]);
      }
    });
    return params;
  };

  return fn;
}

async function getStaticPathsMemoized(runtimeConfig: AstroRuntimeConfig, component: string, mod: any, args: GetStaticPathsArgs): Promise<GetStaticPathsResult> {
  runtimeConfig.cache.staticPaths[component] = runtimeConfig.cache.staticPaths[component] || (await mod.exports.getStaticPaths(args)).flat();
  return runtimeConfig.cache.staticPaths[component];
}

/** Pass a URL to Astro to resolve and build */
async function load(config: AstroRuntimeConfig, rawPathname: string | undefined): Promise<LoadResult> {
  const { logging, snowpackRuntime, snowpack, configManager } = config;
  const { buildOptions, devOptions } = config.astroConfig;

  const site = new URL(buildOptions.site || `http://${devOptions.hostname}:${devOptions.port}`);
  const fullurl = new URL(rawPathname || '/', site.origin);

  const reqPath = decodeURI(fullurl.pathname);

  try {
    const result = await snowpack.loadUrl(reqPath);
    if (!result) throw new Error(`Unable to load ${reqPath}`);
    // success
    debug(logging, 'access', reqPath);
    return {
      statusCode: 200,
      ...result,
    };
  } catch (err) {
    // build error
    if (err.failed) {
      return { statusCode: 500, type: 'unknown', error: err };
    }
    // not found, load a page instead
    // continue...
  }

  info(logging, 'access', reqPath);
  const routeMatch = config.manifest.routes.find((route) => route.pattern.test(reqPath));
  if (!routeMatch) {
    return { statusCode: 404, error: new Error('No matching route found.') };
  }

  const paramsMatch = routeMatch.pattern.exec(reqPath);
  const routeLocation = convertMatchToLocation(routeMatch, config.astroConfig);
  const params = paramsMatch ? getParams(routeMatch.params)(paramsMatch) : {};
  let pageProps = {} as Record<string, any>;

  try {
    if (configManager.needsUpdate()) {
      await configManager.update();
    }
    const mod = await snowpackRuntime.importModule(routeLocation.snowpackURL);
    debug(logging, 'resolve', `${reqPath} -> ${routeLocation.snowpackURL}`);

    // if path isn't static, we need to generate the valid paths first and check against them
    // this helps us to prevent incorrect matches in dev that wouldn't exist in build.
    if (!routeMatch.path) {
      validateGetStaticPathsModule(mod);
      const staticPaths = await getStaticPathsMemoized(config, routeMatch.component, mod, {
        paginate: generatePaginateFunction(routeMatch),
        rss: () => {
          /* noop */
        },
      });
      validateGetStaticPathsResult(staticPaths, logging);
      const matchedStaticPath = staticPaths.find(({ params: _params }) => JSON.stringify(_params) === JSON.stringify(params));
      if (!matchedStaticPath) {
        return { statusCode: 404, error: new Error(`[getStaticPaths] route pattern matched, but no matching static path found. (${reqPath})`) };
      }
      pageProps = { ...matchedStaticPath.props } || {};
    }

    const requestURL = new URL(fullurl.toString());

    // For first release query params are not passed to components.
    // An exception is made for dev server specific routes.
    if (reqPath !== '/500') {
      requestURL.search = '';
    }

    let html = (await mod.exports.__renderPage({
      request: {
        params,
        url: requestURL,
        canonicalURL: canonicalURL(requestURL.pathname, site.toString()),
      },
      children: [],
      props: pageProps,
      css: Array.isArray(mod.css) ? mod.css : typeof mod.css === 'string' ? [mod.css] : [],
      scripts: mod.exports.default[Symbol.for('astro.hoistedScripts')],
    })) as string;

    return {
      statusCode: 200,
      contentType: 'text/html; charset=utf-8',
      contents: html,
      rss: undefined, // TODO: Add back rss support
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.log(formatConfigError(err));
      return {
        statusCode: 500,
        type: 'config-error',
        error: err,
      };
    }

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
          // TODO: why did I need to add this?
          end: 1,
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
  runtimeConfig: AstroRuntimeConfig;
  getStaticPaths: (component: string, mod: any, args: GetStaticPathsArgs) => Promise<GetStaticPathsResult>;
  load: (rawPathname: string | undefined) => Promise<LoadResult>;
  shutdown: () => Promise<void>;
}

export interface RuntimeOptions {
  mode: RuntimeMode;
  logging: LogOptions;
}

interface CreateSnowpackOptions {
  logging: LogOptions;
  mode: RuntimeMode;
  resolvePackageUrl: (pkgName: string) => Promise<string>;
}

/** Create a new Snowpack instance to power Astro */
async function createSnowpack(astroConfig: AstroConfig, options: CreateSnowpackOptions) {
  const { projectRoot, src } = astroConfig;
  const { mode, logging, resolvePackageUrl } = options;

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
    logging: LogOptions;
    configManager: ConfigManager;
  } = {
    astroConfig,
    mode,
    logging,
    resolvePackageUrl,
    configManager,
  };

  const mountOptions = {
    ...(existsSync(astroConfig.public) ? { [fileURLToPath(astroConfig.public)]: { url: '/', static: true, resolve: false } } : {}),
    [fileURLToPath(frontendPath)]: '/_astro_frontend',
    [fileURLToPath(src)]: '/_astro/src', // must be last (greediest)
  };

  // Tailwind: IDK what this does but it makes JIT work 🤷‍♂️
  if (astroConfig.devOptions.tailwindConfig) {
    (process.env as any).TAILWIND_DISABLE_TOUCH = true;
  }

  // Make sure that Snowpack builds our renderer plugins
  const rendererInstances = await configManager.buildRendererInstances();
  const knownEntrypoints: string[] = [
    'astro/dist/internal/__astro_component.js',
    'astro/dist/internal/element-registry.js',
    'astro/dist/internal/fetch-content.js',
    'astro/dist/internal/__astro_slot.js',
    'astro/dist/internal/__astro_hoisted_scripts.js',
    'prismjs',
  ];
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
      [fileURLToPath(new URL('../snowpack-plugin-jsx.cjs', import.meta.url)), astroPluginOptions],
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
      out: fileURLToPath(astroConfig.dist),
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
    logging,
    mode,
    resolvePackageUrl,
  });
  snowpack = snowpackInstance;
  debug(logging, 'core', `snowpack created [${stopTimer(timer.backend)}]`);

  const runtimeConfig: AstroRuntimeConfig = {
    astroConfig,
    cache: { staticPaths: {} },
    logging,
    mode,
    snowpack,
    snowpackRuntime,
    snowpackConfig,
    configManager,
    manifest: createManifest({ config: astroConfig }),
  };

  snowpack.onFileChange(({ filePath }: { filePath: string }) => {
    // Clear out any cached getStaticPaths() data.
    runtimeConfig.cache.staticPaths = {};
    // Rebuild the manifest, if needed
    if (filePath.includes(fileURLToPath(astroConfig.pages))) {
      runtimeConfig.manifest = createManifest({ config: astroConfig });
    }
  });

  return {
    runtimeConfig,
    load: load.bind(null, runtimeConfig),
    getStaticPaths: getStaticPathsMemoized.bind(null, runtimeConfig),
    shutdown: () => snowpack.shutdown(),
  };
}
