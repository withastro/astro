import { existsSync } from 'fs';

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
    }
  | {
      statusCode: 301;
      location: null;
      pathname: string;
    }
  | {
      statusCode: 404;
    };
/** searchForPage - look for astro or md pages */
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

  return {
    statusCode: 404,
  };
}
