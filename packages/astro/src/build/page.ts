import path from 'path';
import { compile as compilePathToRegexp } from 'path-to-regexp';
import type { ServerRuntime as SnowpackServerRuntime } from 'snowpack';
import { fileURLToPath } from 'url';
import type { AstroConfig, BuildOutput, CreateCollectionResult, RuntimeMode } from '../@types/astro';
import type { LogOptions } from '../logger';
import type { AstroRuntime, LoadResult } from '../runtime';
import { validateCollectionModule, validateCollectionResult } from '../util.js';
import { generateRSS } from './rss.js';

interface PageBuildOptions {
  astroConfig: AstroConfig;
  buildState: BuildOutput;
  logging: LogOptions;
  filepath: URL;
  mode: RuntimeMode;
  snowpackRuntime: SnowpackServerRuntime;
  astroRuntime: AstroRuntime;
  site?: string;
}

/** Collection utility */
export function getPageType(filepath: URL): 'collection' | 'static' {
  if (/\$[^.]+.astro$/.test(filepath.pathname)) return 'collection';
  return 'static';
}

/** Build collection */
export async function buildCollectionPage({ astroConfig, filepath, astroRuntime, snowpackRuntime, site, buildState }: PageBuildOptions): Promise<void> {
  const { pages: pagesRoot } = astroConfig;
  const srcURL = filepath.pathname.replace(pagesRoot.pathname, '');
  const pagesPath = astroConfig.pages.pathname.replace(astroConfig.projectRoot.pathname, '');
  const snowpackURL = `/_astro/${pagesPath}${srcURL}.js`;
  const mod = await snowpackRuntime.importModule(snowpackURL);
  validateCollectionModule(mod, filepath.pathname);
  const pageCollection: CreateCollectionResult = await mod.exports.createCollection();
  validateCollectionResult(pageCollection, filepath.pathname);
  let { route, paths: getPaths = () => [{ params: {} }] } = pageCollection;
  const toPath = compilePathToRegexp(route);
  const allPaths = getPaths();
  const allRoutes: string[] = allPaths.map((p) => toPath(p.params));

  // Keep track of all files that have been built, to prevent duplicates.
  const builtURLs = new Set<string>();

  /** Recursively build collection URLs */
  async function loadPage(url: string): Promise<{ url: string; result: LoadResult } | undefined> {
    if (builtURLs.has(url)) {
      return;
    }
    builtURLs.add(url);
    const result = await astroRuntime.load(url);
    if (result.statusCode === 200) {
      const outPath = path.posix.join(url, '/index.html');
      buildState[outPath] = {
        srcPath: filepath,
        contents: result.contents,
        contentType: 'text/html',
        encoding: 'utf8',
      };
    }
    return { url, result };
  }

  const loadResults = await Promise.all(allRoutes.map(loadPage));
  for (const loadResult of loadResults) {
    if (!loadResult) {
      continue;
    }
    const result = loadResult.result;
    if (result.statusCode >= 500) {
      throw new Error((result as any).error);
    }
    if (result.statusCode === 200) {
      const { collectionInfo } = result;
      if (collectionInfo?.rss) {
        if (!site) {
          throw new Error(`[${srcURL}] createCollection() tried to generate RSS but "buildOptions.site" missing in astro.config.mjs`);
        }
        const feedURL = '/feed' + loadResult.url + '.xml';
        const rss = generateRSS({ ...(collectionInfo.rss as any), site }, { srcFile: srcURL, feedURL });
        buildState[feedURL] = {
          srcPath: filepath,
          contents: rss,
          contentType: 'application/rss+xml',
          encoding: 'utf8',
        };
      }
      if (collectionInfo?.additionalURLs) {
        await Promise.all([...collectionInfo.additionalURLs].map(loadPage));
      }
    }
  }
}

/** Build static page */
export async function buildStaticPage({ astroConfig, buildState, filepath, astroRuntime }: PageBuildOptions): Promise<void> {
  const { pages: pagesRoot } = astroConfig;
  const url = filepath.pathname
    .replace(pagesRoot.pathname, '/')
    .replace(/.(astro|md)$/, '')
    .replace(/\/index$/, '/');
  const result = await astroRuntime.load(url);
  if (result.statusCode !== 200) {
    let err = (result as any).error;
    if (!(err instanceof Error)) err = new Error(err);
    err.filename = fileURLToPath(filepath);
    throw err;
  }
  const outFile = path.posix.join(url, '/index.html');
  buildState[outFile] = {
    srcPath: filepath,
    contents: result.contents,
    contentType: 'text/html',
    encoding: 'utf8',
  };
}
