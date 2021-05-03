import 'source-map-support/register.js';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fdir, PathsOutput } from 'fdir';

interface PageLocation {
  fileURL: URL;
  snowpackURL: string;
}
/** findAnyPage and return the _astro candidate for snowpack */
function findAnyPage(candidates: Array<string>, astroRoot: URL): PageLocation | false {
  for (let candidate of candidates) {
    const url = new URL(`./pages/${candidate}`, astroRoot);
    if (existsSync(url)) {
      return {
        fileURL: url,
        snowpackURL: `/_astro/pages/${candidate}.js`,
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
      currentPage?: number;
    }
  | {
      statusCode: 301;
      location: null;
      pathname: string;
    }
  | {
      statusCode: 404;
    };

/** Given a URL, attempt to locate its source file (similar to Snowpack’s load()) */
export function searchForPage(url: URL, astroRoot: URL): SearchResult {
  const reqPath = decodeURI(url.pathname);
  const base = reqPath.substr(1);

  // Try to find index.astro/md paths
  if (reqPath.endsWith('/')) {
    const candidates = [`${base}index.astro`, `${base}index.md`];
    const location = findAnyPage(candidates, astroRoot);
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
    let location = findAnyPage(candidates, astroRoot);
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
  const location = findAnyPage(candidates, astroRoot);
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
    const collection = loadCollection(reqPath, astroRoot);
    if (collection) {
      return {
        statusCode: 200,
        location: collection.location,
        pathname: reqPath,
        currentPage: collection.currentPage || 1,
      };
    }
  }

  if (reqPath === '/500') {
    return {
      statusCode: 200,
      location: {
        fileURL: new URL('./frontend/500.astro', import.meta.url),
        snowpackURL: `/_astro_internal/500.astro.js`,
      },
      pathname: reqPath,
    };
  }

  return {
    statusCode: 404,
  };
}

const crawler = new fdir();

/** load a collection route */
function loadCollection(url: string, astroRoot: URL): { currentPage?: number; location: PageLocation } | undefined {
  const pages = (crawler
    .glob('**/*')
    .crawl(path.join(fileURLToPath(astroRoot), 'pages'))
    .sync() as PathsOutput).filter((filepath) => filepath.startsWith('$') || filepath.includes('/$'));
  for (const pageURL of pages) {
    const reqURL = new RegExp('^/' + pageURL.replace(/\$([^/]+)\.astro/, '$1') + '/?(.*)');
    const match = url.match(reqURL);
    if (match) {
      let currentPage: number | undefined;
      if (match[1]) {
        const segments = match[1].split('/').filter((s) => !!s);
        if (segments.length) {
          const last = segments.pop() as string;
          if (parseInt(last, 10)) {
            currentPage = parseInt(last, 10);
          }
        }
      }
      return {
        location: {
          fileURL: new URL(`./pages/${pageURL}`, astroRoot),
          snowpackURL: `/_astro/pages/${pageURL}.js`,
        },
        currentPage,
      };
    }
  }
}
