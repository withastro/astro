import type { AstroConfig } from '../@types/astro';
import { performance } from 'perf_hooks';

import fs from 'fs';
import path from 'path';
import { URL } from 'url';

/**
 * Only Astro-handled imports need bundling. Any other imports are considered
 * a part of `public/`, and should not be touched.
 */
export const IS_ASTRO_FILE_URL = /^\/(_astro|_astro_frontend|_snowpack)\//;

/** Normalize URL to its canonical form */
export function canonicalURL(url: string, base?: string): URL {
  let pathname = url.replace(/\/index.html$/, ''); // index.html is not canonical
  pathname = pathname.replace(/\/1\/?$/, ''); // neither is a trailing /1/ (impl. detail of collections)
  if (!path.extname(pathname)) pathname = pathname.replace(/(\/+)?$/, '/'); // add trailing slash if there’s no extension
  pathname = pathname.replace(/\/+/g, '/'); // remove duplicate slashes (URL() won’t)
  if (base) {
    return new URL('.' + pathname, base);
  } else {
    return new URL(pathname, base);
  }
}

/** Resolve final output URL */
export function getDistPath(specifier: string, { astroConfig, srcPath }: { astroConfig: AstroConfig; srcPath: URL }): string {
  if (specifier[0] === '/') return specifier; // assume absolute URLs are correct
  const { pages: pagesRoot, projectRoot } = astroConfig;

  const fileLoc = new URL(specifier, srcPath);
  const projectLoc = fileLoc.pathname.replace(projectRoot.pathname, '');
  const ext = path.extname(fileLoc.pathname);

  const isPage = fileLoc.pathname.includes(pagesRoot.pathname) && (ext === '.astro' || ext === '.md');
  // if this lives in src/pages, return that URL
  if (isPage) {
    const [, publicURL] = projectLoc.split(pagesRoot.pathname);
    return publicURL || '/index.html'; // if this is missing, this is the root
  }

  // if this is in public/, use that as final URL
  const isPublicAsset = fileLoc.pathname.includes(astroConfig.public.pathname);
  if (isPublicAsset) {
    return fileLoc.pathname.replace(astroConfig.public.pathname, '/');
  }

  // otherwise, return /_astro/* url
  return '/_astro/' + projectLoc;
}

/** Given a final output URL, guess at src path (may be inaccurate; only for non-pages) */
export function getSrcPath(distURL: string, { astroConfig }: { astroConfig: AstroConfig }): URL {
  if (distURL.startsWith('/_astro/')) {
    return new URL('.' + distURL.replace(/^\/_astro\//, ''), astroConfig.projectRoot);
  } else if (distURL === '/index.html') {
    return new URL('./index.astro', astroConfig.pages);
  }

  const possibleURLs = [
    new URL('.' + distURL, astroConfig.public), // public asset
    new URL('.' + distURL.replace(/([^\/])+\/d+\/index.html/, '$$1.astro'), astroConfig.pages), // collection page
    new URL('.' + distURL.replace(/\/index\.html$/, '.astro'), astroConfig.pages), // page
    // TODO: Astro pages (this isn’t currently used for that lookup)
  ];

  // if this is in public/ or pages/, return that
  for (const possibleURL of possibleURLs) {
    if (fs.existsSync(possibleURL)) return possibleURL;
  }

  // otherwise resolve relative to project
  return new URL('.' + distURL, astroConfig.projectRoot);
}

/** Stop timer & format time for profiling */
export function stopTimer(start: number): string {
  const diff = performance.now() - start;
  return diff < 750 ? `${Math.round(diff)}ms` : `${(diff / 1000).toFixed(1)}s`;
}
