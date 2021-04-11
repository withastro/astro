import type { SnowpackDevServer, ServerRuntime as SnowpackServerRuntime, SnowpackConfig } from 'snowpack';
import type { AstroConfig, RuntimeMode } from './@types/astro';
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

type LoadResultSuccess = {
  statusCode: 200;
  contents: string | Buffer;
  contentType?: string | false;
};
type LoadResultNotFound = { statusCode: 404; error: Error };
type LoadResultRedirect = { statusCode: 301 | 302; location: string };
type LoadResultError = { statusCode: 500 } & ({ type: 'parse-error'; error: CompileError } | { type: 'unknown'; error: Error });

export type LoadResult = LoadResultSuccess | LoadResultNotFound | LoadResultRedirect | LoadResultError;

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
    let html = (await mod.exports.__renderPage({
      request: {
        host: fullurl.hostname,
        path: fullurl.pathname,
        href: fullurl.toString(),
      },
      children: [],
      props: {},
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
      contents: html,
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
async function createSnowpack(astroConfig: AstroConfig, env: Record<string, any>) {
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
    [astroRoot.pathname]: '/_astro',
    [internalPath.pathname]: '/_astro_internal',
  };

  if (existsSync(astroConfig.public)) {
    mountOptions[astroConfig.public.pathname] = '/';
  }

  const snowpackConfig = await loadConfiguration({
    root: projectRoot.pathname,
    mount: mountOptions,
    plugins: [
      [new URL('../snowpack-plugin.cjs', import.meta.url).pathname, astroPlugOptions],
      require.resolve('@snowpack/plugin-sass'),
      require.resolve('@snowpack/plugin-svelte'),
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
      external: ['@vue/server-renderer', 'node-fetch', 'prismjs/components/'],
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
  });

  const { snowpack: frontendSnowpack, snowpackRuntime: frontendSnowpackRuntime, snowpackConfig: frontendSnowpackConfig } = await createSnowpack(astroConfig, {
    astro: false,
  });

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
