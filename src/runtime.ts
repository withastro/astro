import type { SnowpackDevServer, ServerRuntime as SnowpackServerRuntime, LoadResult as SnowpackLoadResult, SnowpackConfig } from 'snowpack';
import type { AstroConfig } from './@types/astro';
import type { LogOptions } from './logger';
import type { CompileError } from './parser/utils/error.js';
import { info, error, parseError } from './logger.js';

import { existsSync, promises as fsPromises } from 'fs';
import { loadConfiguration, startServer as startSnowpackServer } from 'snowpack';

const { readFile } = fsPromises;

interface RuntimeConfig {
  astroConfig: AstroConfig;
  logging: LogOptions;
  snowpack: SnowpackDevServer;
  snowpackRuntime: SnowpackServerRuntime;
  snowpackConfig: SnowpackConfig;
}

type LoadResultSuccess = {
  statusCode: 200;
  contents: string | Buffer;
  contentType?: string | false;
};
type LoadResultNotFound = { statusCode: 404; error: Error };
type LoadResultError = { statusCode: 500 } & ({ type: 'parse-error'; error: CompileError } | { type: 'unknown'; error: Error });

export type LoadResult = LoadResultSuccess | LoadResultNotFound | LoadResultError;

async function load(config: RuntimeConfig, rawPathname: string | undefined): Promise<LoadResult> {
  const { logging, snowpack, snowpackRuntime } = config;
  const { astroRoot } = config.astroConfig;

  const fullurl = new URL(rawPathname || '/', 'https://example.org/');
  const reqPath = decodeURI(fullurl.pathname);
  const selectedPage = reqPath.substr(1) || 'index';
  info(logging, 'access', reqPath);

  const selectedPageLoc = new URL(`./pages/${selectedPage}.astro`, astroRoot);
  const selectedPageMdLoc = new URL(`./pages/${selectedPage}.md`, astroRoot);
  const selectedPageUrl = `/_astro/pages/${selectedPage}.js`;

  // Non-Astro pages (file resources)
  if (!existsSync(selectedPageLoc) && !existsSync(selectedPageMdLoc)) {
    try {
      const result = await snowpack.loadUrl(reqPath);

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

  try {
    const mod = await snowpackRuntime.importModule(selectedPageUrl);
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
    const styleTags = Array.isArray(mod.css) && mod.css.length ? mod.css.reduce((markup, url) => `${markup}\n<link rel="stylesheet" type="text/css" href="${url}" />`, '') : ``;
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
    switch (err.code) {
      case 'parse-error': {
        return {
          statusCode: 500,
          type: 'parse-error',
          error: err,
        };
      }
      default: {
        return {
          statusCode: 500,
          type: 'unknown',
          error: err,
        };
      }
    }
  }
}

export interface AstroRuntime {
  runtimeConfig: RuntimeConfig;
  load: (rawPathname: string | undefined) => Promise<LoadResult>;
  shutdown: () => Promise<void>;
}

interface RuntimeOptions {
  logging: LogOptions;
}

export async function createRuntime(astroConfig: AstroConfig, { logging }: RuntimeOptions): Promise<AstroRuntime> {
  const { projectRoot, astroRoot, extensions } = astroConfig;

  const internalPath = new URL('./frontend/', import.meta.url);

  let snowpack: SnowpackDevServer;
  const astroPlugOptions: {
    resolve?: (s: string) => Promise<string>;
    extensions?: Record<string, string>;
  } = {
    extensions,
    resolve: async (pkgName: string) => snowpack.getUrlForPackage(pkgName),
  };

  const snowpackConfig = await loadConfiguration({
    root: projectRoot.pathname,
    mount: {
      [astroRoot.pathname]: '/_astro',
      [internalPath.pathname]: '/_astro_internal',
      public: '/',
    },
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
  snowpack = await startSnowpackServer({
    config: snowpackConfig,
    lockfile: null,
  });
  const snowpackRuntime = snowpack.getServerRuntime();

  const runtimeConfig: RuntimeConfig = {
    astroConfig,
    logging,
    snowpack,
    snowpackRuntime,
    snowpackConfig,
  };

  return {
    runtimeConfig,
    load: load.bind(null, runtimeConfig),
    shutdown: () => snowpack.shutdown(),
  };
}
