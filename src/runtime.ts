import type { SnowpackDevServer, ServerRuntime as SnowpackServerRuntime, SnowpackConfig } from 'snowpack';
import type { AstroConfig } from './@types/astro';
import type { LogOptions } from './logger';
import type { CompileError } from './parser/utils/error.js';
import { debug, info } from './logger.js';

import { existsSync } from 'fs';
import { loadConfiguration, logger as snowpackLogger, startServer as startSnowpackServer } from 'snowpack';

interface RuntimeConfig {
  astroConfig: AstroConfig;
  logging: LogOptions;
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
type LoadResultError = { statusCode: 500 } & ({ type: 'parse-error'; error: CompileError } | { type: 'unknown'; error: Error });

export type LoadResult = LoadResultSuccess | LoadResultNotFound | LoadResultError;

// Disable snowpack from writing to stdout/err.
snowpackLogger.level = 'silent';

async function load(config: RuntimeConfig, rawPathname: string | undefined): Promise<LoadResult> {
  const { logging, backendSnowpackRuntime, frontendSnowpack } = config;
  const { astroRoot } = config.astroConfig;

  const fullurl = new URL(rawPathname || '/', 'https://example.org/');
  const reqPath = decodeURI(fullurl.pathname);
  const selectedPage = reqPath.substr(1) || 'index';
  info(logging, 'access', reqPath);

  const selectedPageLoc = new URL(`./pages/${selectedPage}.astro`, astroRoot);
  const selectedPageMdLoc = new URL(`./pages/${selectedPage}.md`, astroRoot);

  // Non-Astro pages (file resources)
  if (!existsSync(selectedPageLoc) && !existsSync(selectedPageMdLoc)) {
    try {
      console.log('loading', reqPath);
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

  for (const url of [`/_astro/pages/${selectedPage}.astro.js`, `/_astro/pages/${selectedPage}.md.js`]) {
    try {
      const mod = await backendSnowpackRuntime.importModule(url);
      debug(logging, 'resolve', `${reqPath} -> ${url}`);
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
      // if this is a 404, try the next URL (will be caught at the end)
      const notFoundError = err.toString().startsWith('Error: Not Found');
      if (notFoundError) {
        continue;
      }

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

  // couldn‘t find match; 404
  return {
    statusCode: 404,
    type: 'unknown',
    error: new Error(`Could not locate ${selectedPage}`),
  };
}

export interface AstroRuntime {
  runtimeConfig: RuntimeConfig;
  load: (rawPathname: string | undefined) => Promise<LoadResult>;
  shutdown: () => Promise<void>;
}

interface RuntimeOptions {
  logging: LogOptions;
}

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
    plugins: [[new URL('../snowpack-plugin.cjs', import.meta.url).pathname, astroPlugOptions], '@snowpack/plugin-sass', '@snowpack/plugin-svelte', '@snowpack/plugin-vue'],
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
      external: ['@vue/server-renderer', 'node-fetch'],
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

export async function createRuntime(astroConfig: AstroConfig, { logging }: RuntimeOptions): Promise<AstroRuntime> {
  const { snowpack: backendSnowpack, snowpackRuntime: backendSnowpackRuntime, snowpackConfig: backendSnowpackConfig } = await createSnowpack(astroConfig, {
    astro: true,
  });

  const { snowpack: frontendSnowpack, snowpackRuntime: frontendSnowpackRuntime, snowpackConfig: frontendSnowpackConfig } = await createSnowpack(astroConfig, {
    astro: false,
  });

  const runtimeConfig: RuntimeConfig = {
    astroConfig,
    logging,
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
