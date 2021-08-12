import _path from 'path';
import type { ServerRuntime as SnowpackServerRuntime } from 'snowpack';
import { fileURLToPath } from 'url';
import type { AstroConfig, BuildOutput, GetStaticPathsResult, RouteData } from '../@types/astro';
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
  snowpackRuntime,
  route,
  logging,
}: {
  astroConfig: AstroConfig;
  route: RouteData;
  snowpackRuntime: SnowpackServerRuntime;
  logging: LogOptions;
}): Promise<{ paths: string[]; rss: any }> {
  const location = convertMatchToLocation(route, astroConfig);
  const mod = await snowpackRuntime.importModule(location.snowpackURL);
  validateGetStaticPathsModule(mod);
  const [rssFunction, rssResult] = generateRssFunction(astroConfig.buildOptions.site, route);
  const staticPaths: GetStaticPathsResult = (
    await mod.exports.getStaticPaths({
      paginate: generatePaginateFunction(route),
      rss: rssFunction,
    })
  ).flat();
  validateGetStaticPathsResult(staticPaths, logging);
  return {
    paths: staticPaths.map((staticPath) => staticPath.params && route.generate(staticPath.params)).filter(Boolean),
    rss: rssResult,
  };
}

/** Build static page */
export async function buildStaticPage({ astroConfig, buildState, path, route, astroRuntime }: PageBuildOptions): Promise<void> {
  const location = convertMatchToLocation(route, astroConfig);
  const result = await astroRuntime.load(path);
  if (result.statusCode !== 200) {
    let err = (result as any).error;
    if (!(err instanceof Error)) err = new Error(err);
    err.filename = fileURLToPath(location.fileURL);
    throw err;
  }
  const outFile = _path.posix.join(path, '/index.html');
  buildState[outFile] = {
    srcPath: location.fileURL,
    contents: result.contents,
    contentType: 'text/html',
    encoding: 'utf8',
  };
}
