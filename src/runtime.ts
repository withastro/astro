import type { SnowpackDevServer, ServerRuntime as SnowpackServerRuntime, LoadResult as SnowpackLoadResult } from 'snowpack';
import type { AstroConfig } from './@types/astro';
import type { LogOptions } from './logger';
import type { CompileError } from './compiler/utils/error.js';
import { info, error, parseError } from './logger.js';

import { existsSync, promises as fsPromises } from 'fs';
import { loadConfiguration, startServer as startSnowpackServer } from 'snowpack';

const { readFile } = fsPromises;

interface RuntimeConfig {
  astroConfig: AstroConfig;
  logging: LogOptions;
  snowpack: SnowpackDevServer;
  snowpackRuntime: SnowpackServerRuntime;
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
    const html = (await mod.exports.__renderPage({
      request: {
        host: fullurl.hostname,
        path: fullurl.pathname,
        href: fullurl.toString(),
      },
      children: [],
      props: {},
    })) as string;

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

export async function createRuntime(astroConfig: AstroConfig, logging: LogOptions) {
  const { projectRoot, astroRoot, extensions } = astroConfig;

  const internalPath = new URL('./frontend/', import.meta.url);

  // Workaround for SKY-251
  const astroPlugOptions: {
    resolve?: (s: string) => string;
    extensions?: Record<string, string>;
  } = { extensions };
  if (existsSync(new URL('./package-lock.json', projectRoot))) {
    const pkgLockStr = await readFile(new URL('./package-lock.json', projectRoot), 'utf-8');
    const pkgLock = JSON.parse(pkgLockStr);
    astroPlugOptions.resolve = (pkgName: string) => {
      const ver = pkgLock.dependencies[pkgName].version;
      return `/_snowpack/pkg/${pkgName}.v${ver}.js`;
    };
  }

  const snowpackConfig = await loadConfiguration({
    root: projectRoot.pathname,
    mount: {
      [astroRoot.pathname]: '/_astro',
      [internalPath.pathname]: '/_astro_internal',
    },
    plugins: [[new URL('../snowpack-plugin.cjs', import.meta.url).pathname, astroPlugOptions]],
    devOptions: {
      open: 'none',
      output: 'stream',
      port: 0,
    },
    packageOptions: {
      knownEntrypoints: ['preact-render-to-string'],
      external: ['@vue/server-renderer', 'node-fetch'],
    },
  });
  const snowpack = await startSnowpackServer({
    config: snowpackConfig,
    lockfile: null,
  });
  const snowpackRuntime = snowpack.getServerRuntime();

  const runtimeConfig: RuntimeConfig = {
    astroConfig,
    logging,
    snowpack,
    snowpackRuntime,
  };

  return {
    load: load.bind(null, runtimeConfig),
    shutdown: () => snowpack.shutdown(),
  };
}
