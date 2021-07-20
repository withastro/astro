import type { AstroConfig, BuildOutput, RuntimeMode } from '../@types/astro';
import type { AstroRuntime, LoadResult } from '../runtime';
import type { LogOptions } from '../logger';
import path from 'path';
import { generateRSS } from './rss.js';
import { fileURLToPath } from 'url';

interface PageBuildOptions {
  astroConfig: AstroConfig;
  buildState: BuildOutput;
  logging: LogOptions;
  filepath: URL;
  mode: RuntimeMode;
  resolvePackageUrl: (s: string) => Promise<string>;
  runtime: AstroRuntime;
  site?: string;
}

/** Collection utility */
export function getPageType(filepath: URL): 'collection' | 'static' {
  if (/\$[^.]+.astro$/.test(filepath.pathname)) return 'collection';
  return 'static';
}

/** Build collection */
export async function buildCollectionPage({ astroConfig, filepath, runtime, site, buildState }: PageBuildOptions): Promise<void> {
  const { pages: pagesRoot } = astroConfig;
  const srcURL = filepath.pathname.replace(pagesRoot.pathname, '/');
  const outURL = srcURL.replace(/\$([^.]+)\.astro$/, '$1');

  const builtURLs = new Set<string>(); // !important: internal cache that prevents building the same URLs

  /** Recursively build collection URLs */
  async function loadCollection(url: string): Promise<LoadResult | undefined> {
    if (builtURLs.has(url)) return; // this stops us from recursively building the same pages over and over
    const result = await runtime.load(url);
    builtURLs.add(url);
    if (result.statusCode === 200) {
      const outPath = path.posix.join(url, '/index.html');
      buildState[outPath] = {
        srcPath: filepath,
        contents: result.contents,
        contentType: 'text/html',
        encoding: 'utf8',
      };
    }
    return result;
  }

  const [result] = await Promise.all([
    loadCollection(outURL) as Promise<LoadResult>, // first run will always return a result so assert type here
  ]);

  if (result.statusCode >= 500) {
    throw new Error((result as any).error);
  }
  if (result.statusCode === 200 && !result.collectionInfo) {
    throw new Error(`[${srcURL}]: Collection page must export createCollection() function`);
  }

  // note: for pages that require params (/tag/:tag), we will get a 404 but will still get back collectionInfo that tell us what the URLs should be
  if (result.collectionInfo) {
    // build subsequent pages
    await Promise.all(
      [...result.collectionInfo.additionalURLs].map(async (url) => {
        // for the top set of additional URLs, we render every new URL generated
        const addlResult = await loadCollection(url);
        builtURLs.add(url);
        if (addlResult && addlResult.collectionInfo) {
          // believe it or not, we may still have a few unbuilt pages left. this is our last crawl:
          await Promise.all([...addlResult.collectionInfo.additionalURLs].map(async (url2) => loadCollection(url2)));
        }
      })
    );

    if (result.collectionInfo.rss) {
      if (!site) throw new Error(`[${srcURL}] createCollection() tried to generate RSS but "buildOptions.site" missing in astro.config.mjs`);
      let feedURL = outURL === '/' ? '/index' : outURL;
      feedURL = '/feed' + feedURL + '.xml';
      const rss = generateRSS({ ...(result.collectionInfo.rss as any), site }, { srcFile: srcURL, feedURL });
      buildState[feedURL] = {
        srcPath: filepath,
        contents: rss,
        contentType: 'application/rss+xml',
        encoding: 'utf8',
      };
    }
  }
}

/** Build static page */
export async function buildStaticPage({ astroConfig, buildState, filepath, runtime }: PageBuildOptions): Promise<void> {
  const { pages: pagesRoot } = astroConfig;
  const url = filepath.pathname
    .replace(pagesRoot.pathname, '/')
    .replace(/.(astro|md)$/, '')
    .replace(/\/index$/, '/');
  const result = await runtime.load(url);
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
