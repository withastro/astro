import type { AstroConfig } from '../@types/astro';
import { performance } from 'perf_hooks';

import path from 'path';
import { fileURLToPath, URL } from 'url';

/** Normalize URL to its canonical form */
export function canonicalURL(url: string, base?: string): URL {
  let pathname = url.replace(/\/index.html$/, ''); // index.html is not canonical
  pathname = pathname.replace(/\/1\/?$/, ''); // neither is a trailing /1/ (impl. detail of collections)
  if (!path.extname(pathname)) pathname = pathname.replace(/(\/+)?$/, '/'); // add trailing slash if there’s no extension
  return new URL(pathname, base);
}

/** Sort a Set */
export function sortSet(set: Set<string>): Set<string> {
  return new Set([...set].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })));
}

/** Resolve final output URL */
export function getDistPath(specifier: string, { astroConfig, srcPath }: { astroConfig: AstroConfig; srcPath: URL }): string {
  if (specifier[0] === '/') return specifier; // assume absolute URLs are correct

  const fileLoc = path.posix.join(path.posix.dirname(fileURLToPath(srcPath)), specifier);
  const projectLoc = path.posix.relative(fileURLToPath(astroConfig.astroRoot), fileLoc);
  const pagesDir = fileURLToPath(new URL('/pages', astroConfig.astroRoot));
  // if this lives above src/pages, return that URL
  if (fileLoc.includes(pagesDir)) {
    const [, publicURL] = projectLoc.split(pagesDir);
    return publicURL || '/index.html'; // if this is missing, this is the root
  }
  // otherwise, return /_astro/* url
  return '/_astro/' + projectLoc;
}

/** Given a final output URL, guess at src path (may be inaccurate) */
export function getSrcPath(url: string, { astroConfig }: { astroConfig: AstroConfig }): URL {
  if (url.startsWith('/_astro/')) {
    return new URL(url.replace(/^\/_astro\//, ''), astroConfig.astroRoot);
  }
  let srcFile = url.replace(/^\//, '').replace(/\/index.html$/, '.astro');
  return new URL('./pages/' + srcFile, astroConfig.astroRoot);
}

/** Stop timer & format time for profiling */
export function stopTimer(start: number): string {
  const diff = performance.now() - start;
  return diff < 750 ? `${Math.round(diff)}ms` : `${(diff / 1000).toFixed(1)}s`;
}
