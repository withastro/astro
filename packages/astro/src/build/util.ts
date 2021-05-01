import path from 'path';

/** Normalize URL to its canonical form */
export function canonicalURL(url: string, base?: string): string {
  return new URL(
    path.extname(url) ? url : url.replace(/(\/+)?$/, '/'), // add trailing slash if there’s no extension
    base
  ).href;
}

/** Sort a Set */
export function sortSet(set: Set<string>): Set<string> {
  return new Set([...set].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })));
}

/** Given a URL, transform it into its final form */
export function absoluteURL(url: string, cwd: string): string {
  if (url[0] === '/') return url;
  return '/' + path.posix.relative(cwd, url);
}
