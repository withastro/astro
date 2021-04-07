import { existsSync } from 'fs';
import path from 'path';
import glob from 'tiny-glob/sync.js';

interface PageLocation {
  fileURL: URL;
  snowpackURL: string;
  params?: Record<string, string>;
}

/** Given lookup candidates, determine if a file exists on disk */
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

/** Given a URL, try and find a dynamic route (square brackets in filepath) */
function findDynamicPage(url: string, astroRoot: URL): PageLocation | undefined {
  const pages = glob('**/*', { cwd: path.join(astroRoot.pathname, 'pages'), filesOnly: true });
  let specificity = 0; // prefer more specific dynamic routes (more URL segments) to less specific ones
  let foundURL: string | undefined;
  let params: Record<string, string> | undefined;

  for (let pageURL of pages) {
    pageURL = pageURL.replace(/\\/g, '/'); // glob may return backslashes on Windows but we need POSIX-style for the next step
    // replace every dynamic route (*/[page].astro) with a named capture group (?<page>)
    const dynamicURL = new RegExp('^/' + pageURL.replace(/\[([^\]]+)\]/g, '(?<$1>[^/]+)').replace(/\.astro$/, ''));
    let match = url.match(dynamicURL);
    if (!match) match = url.replace(/\/?$/, '/index').match(dynamicURL); // if this missed, try suffixing an "index"
    if (match) {
      const urlSpecificity = url.match(/\//g);
      if (!foundURL) {
        // if this is the first found match, accept it unconditionally
        specificity = urlSpecificity ? urlSpecificity.length : 0;
        foundURL = pageURL;
        params = match.groups;
        continue;
      }
      // a match has already been found. is this more specific (has more URL segments)? If so, take the new one; if not, skip
      if (urlSpecificity && urlSpecificity.length > specificity) {
        specificity = urlSpecificity.length;
        foundURL = pageURL;
        params = match.groups;
      }
    }
  }

  if (foundURL) {
    return {
      fileURL: new URL(`./pages/${foundURL}`, astroRoot),
      snowpackURL: `/_astro/pages/${foundURL}.js`,
      params: sanitizeParams(params), // the named capture groups do all the work for us!
    };
  }
}

/** Params util */
function sanitizeParams(query?: Record<string, any>): Record<string, any> | undefined {
  if (!query || typeof query !== 'object' || Array.isArray(query)) return query;
  const q: Record<string, any> = {};
  for (const [k, v] of Object.entries(query)) {
    // handle number
    const maybeNum = parseFloat(v);
    if (maybeNum.toString() === v) {
      q[k] = maybeNum;
      continue;
    }
    q[k] = v;
  }
  return q;
}

type SearchResult =
  | {
      statusCode: 200;
      location: PageLocation;
      pathname: string;
      params?: Record<string, string>;
    }
  | {
      statusCode: 301;
      location: null;
      pathname: string;
    }
  | {
      statusCode: 404;
    };

// cache filesystem lookups so we‘re not scanning on every refresh
const miniRouteCache = new Map<string, PageLocation>();

/** Given a URL and an astroRoot, attempt to locate the source file */
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
  let location = findAnyPage(candidates, astroRoot) || undefined;
  if (location) {
    return {
      statusCode: 301,
      location: null,
      pathname: reqPath + '/',
    };
  }

  // Try and resolve dynamic routes (static routes take priority)
  location = miniRouteCache.get(reqPath);
  if (!location) {
    location = findDynamicPage(reqPath, astroRoot);
    if (location) miniRouteCache.set(reqPath, location); // only cache on find
  }
  if (location) {
    return {
      statusCode: 200,
      location,
      pathname: reqPath,
      params: location.params,
    };
  } else {
    miniRouteCache.delete(reqPath); // clear cache on miss
  }

  return {
    statusCode: 404,
  };
}
