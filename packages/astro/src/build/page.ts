import _path from 'path';
import type { ServerRuntime as SnowpackServerRuntime } from 'snowpack';
import { fileURLToPath } from 'url';
import type { AstroConfig, BuildOutput, RouteData } from '../@types/astro';
import { LogOptions } from '../logger';
import type { AstroRuntime } from '../runtime.js';
import { convertMatchToLocation, validateGetStaticPathsModule, validateGetStaticPathsResult } from '../util.js';
import { generatePaginateFunction } from './paginate.js';
import { generateRssFunction } from './rss.js';

interface PageBuildOptions {
  astroConfig: AstroConfig;
  buildState: BuildOutput;
  path: string;
  route: RouteData;
  astroRuntime: AstroRuntime;
}

/** Build dynamic page */
export async function getStaticPathsForPage({
  astroConfig,
  astroRuntime,
  snowpackRuntime,
  route,
  logging,
}: {
  astroConfig: AstroConfig;
  astroRuntime: AstroRuntime;
  route: RouteData;
  snowpackRuntime: SnowpackServerRuntime;
  logging: LogOptions;
}): Promise<{ paths: string[]; rss: any }> {
  const location = convertMatchToLocation(route, astroConfig);
  const mod = await snowpackRuntime.importModule(location.snowpackURL);
  validateGetStaticPathsModule(mod);
  const [rssFunction, rssResult] = generateRssFunction(astroConfig.buildOptions.site, route);
  const staticPaths = await astroRuntime.getStaticPaths(route.component, mod, {
    paginate: generatePaginateFunction(route),
    rss: rssFunction,
  });
  validateGetStaticPathsResult(staticPaths, logging);
  return {
    paths: staticPaths.map((staticPath) => staticPath.params && route.generate(staticPath.params)).filter(Boolean),
    rss: rssResult,
  };
}

function formatOutFile(path: string, pageDirectoryUrl: boolean) {
  if (path === '/404') {
    return '/404.html';
  }
  if (path === '/') {
    return '/index.html';
  }
  if (pageDirectoryUrl) {
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
  buildState[formatOutFile(path, astroConfig.buildOptions.pageDirectoryUrl)] = {
    srcPath: location.fileURL,
    contents: result.contents,
    contentType: 'text/html',
    encoding: 'utf8',
  };
}
