import type { AstroConfig, RouteData } from '../../@types/astro-core';
import type { BuildOutput } from '../../@types/astro-build';
import type { ViteDevServer } from '../vite';
import _path from 'path';
import { fileURLToPath } from 'url';
import { LogOptions } from '../logger';
import { loadModule } from '../ssr/index.js';
import { validateGetStaticPathsModule, validateGetStaticPathsResult } from '../ssr/routing.js';
import { generatePaginateFunction } from './paginate.js';
import { generateRssFunction } from './rss.js';

interface PageLocation {
  fileURL: URL;
  snowpackURL: string;
}

function convertMatchToLocation(routeMatch: RouteData, astroConfig: AstroConfig): PageLocation {
  const url = new URL(`./${routeMatch.component}`, astroConfig.projectRoot);
  return {
    fileURL: url,
    snowpackURL: `/_astro/${routeMatch.component}.js`,
  };
}

interface PageBuildOptions {
  astroConfig: AstroConfig;
  buildState: BuildOutput;
  path: string;
  route: RouteData;
}

/** Build dynamic page */
export async function getStaticPathsForPage({
  astroConfig,
  route,
  logging,
  viteServer,
}: {
  astroConfig: AstroConfig;
  route: RouteData;
  logging: LogOptions;
  viteServer: ViteDevServer;
}): Promise<{ paths: string[]; rss: any }> {
  const location = convertMatchToLocation(route, astroConfig);
  //const mod = await snowpackRuntime.importModule(location.snowpackURL);
  const mod = await loadModule(location.fileURL, viteServer);
  validateGetStaticPathsModule(mod);
  const [rssFunction, rssResult] = generateRssFunction(astroConfig.buildOptions.site, route);
  const staticPaths  = mod.getStaticPaths!({
    paginate: generatePaginateFunction(route),
    rss: rssFunction,
  });
  validateGetStaticPathsResult(staticPaths, logging);
  return {
    paths: staticPaths.map((staticPath) => staticPath.params && route.generate(staticPath.params)).filter(Boolean),
    rss: rssResult,
  };
}

function formatOutFile(path: string, pageUrlFormat: AstroConfig['buildOptions']['pageUrlFormat']) {
  if (path === '/404') {
    return '/404.html';
  }
  if (path === '/') {
    return '/index.html';
  }
  if (pageUrlFormat === 'directory') {
    return _path.posix.join(path, '/index.html');
  }
  return `${path}.html`;
}
/** Build static page */
export async function buildStaticPage({ astroConfig, buildState, path, route, astroRuntime }: PageBuildOptions): Promise<void> {
  const location = convertMatchToLocation(route, astroConfig);
  const normalizedPath = astroConfig.devOptions.trailingSlash === 'never' ? path : path.endsWith('/') ? path : `${path}/`;
  const result = await astroRuntime.load(normalizedPath);
  if (result.statusCode !== 200) {
    let err = (result as any).error;
    if (!(err instanceof Error)) err = new Error(err);
    err.filename = fileURLToPath(location.fileURL);
    throw err;
  }
  buildState[formatOutFile(path, astroConfig.buildOptions.pageUrlFormat)] = {
    srcPath: location.fileURL,
    contents: result.contents,
    contentType: 'text/html',
    encoding: 'utf8',
  };
}
