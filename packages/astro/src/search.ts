import type { AstroConfig } from './@types/astro';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import glob from 'tiny-glob';
import slash from 'slash';

interface PageLocation {
  fileURL: URL;
  snowpackURL: string;
}
/** findAnyPage and return the _astro candidate for snowpack */
function findAnyPage(candidates: Array<string>, astroConfig: AstroConfig): PageLocation | false {
  for (let candidate of candidates) {
    const url = new URL(`./${candidate}`, astroConfig.pages);
    if (existsSync(url)) {
      const pagesPath = astroConfig.pages.pathname.replace(astroConfig.projectRoot.pathname, '');
      return {
        fileURL: url,
        snowpackURL: `/_astro/${pagesPath}${candidate}.js`,
      };
    }
  }
  return false;
}

type SearchResult =
  | {
      statusCode: 200;
      location: PageLocation;
      pathname: string;
    }
  | {
      statusCode: 301;
      location: null;
      pathname: string;
    }
  | {
      statusCode: 404;
    };

/**
 * Given a URL, attempt to locate its source file (similar to Snowpack’s load()).
 *
 * TODO(perf): This function (and findCollectionPage(), its helper function) make several
 * checks against the file system on every request. It would be better to keep an in-memory
 * list of all known files that we could make instant, synchronous checks against.
 */
export async function searchForPage(url: URL, astroConfig: AstroConfig): Promise<SearchResult> {
  const reqPath = decodeURI(url.pathname);
  const base = reqPath.substr(1);

  // Try to find index.astro/md paths
  if (reqPath.endsWith('/')) {
    const candidates = [`${base}index.astro`, `${base}index.md`];
    const location = findAnyPage(candidates, astroConfig);
    if (location) {
      return {
        statusCode: 200,
        location,
        pathname: reqPath,
      };
    }
  } else {
    // Try to find the page by its name.
    const candidates = [`${base}.astro`, `${base}.md`];
    let location = findAnyPage(candidates, astroConfig);
    if (location) {
      return {
        statusCode: 200,
        location,
        pathname: reqPath,
      };
    }
  }

  // Try to find name/index.astro/md
  const candidates = [`${base}/index.astro`, `${base}/index.md`];
  const location = findAnyPage(candidates, astroConfig);
  if (location) {
    return {
      statusCode: 301,
      location: null,
      pathname: reqPath + '/',
    };
  }

  // Try and load collections (but only for non-extension files)
  const hasExt = !!path.extname(reqPath);
  if (!location && !hasExt) {
    const collectionLocation = await findCollectionPage(reqPath, astroConfig);
    if (collectionLocation) {
      return {
        statusCode: 200,
        location: collectionLocation,
        pathname: reqPath,
      };
    }
  }

  if (reqPath === '/500') {
    return {
      statusCode: 200,
      location: {
        fileURL: new URL('./frontend/500.astro', import.meta.url),
        snowpackURL: `/_astro_frontend/500.astro.js`,
      },
      pathname: reqPath,
    };
  }

  return {
    statusCode: 404,
  };
}

/** Find a collection page file in the pages directory that matches the request. */
async function findCollectionPage(reqPath: string, astroConfig: AstroConfig): Promise<PageLocation | undefined> {
  const cwd = fileURLToPath(astroConfig.pages);
  const allCollections: Record<string, PageLocation> = {};
  const files = await glob('**/$*.{astro,md}', { cwd, filesOnly: true });
  for (const srcURL of files) {
    const pagesPath = astroConfig.pages.pathname.replace(astroConfig.projectRoot.pathname, '');
    const snowpackURL = `/_astro/${pagesPath}${srcURL}.js`;
    const reqURL =
      '/' +
      srcURL
        .replace(/\.(astro|md)$/, '')
        .replace(/(^|[\/])\$/, '$1')
        .replace(/index$/, '');
    allCollections[reqURL] = { snowpackURL, fileURL: new URL(srcURL, astroConfig.pages) };
  }

  // Match the more specific filename first. If no match, return nothing.
  let collectionMatchState = reqPath;
  do {
    if (allCollections[collectionMatchState]) {
      return allCollections[collectionMatchState];
    }
    collectionMatchState = collectionMatchState.substring(0, collectionMatchState.lastIndexOf('/'));
  } while (collectionMatchState.length > 0);
}
