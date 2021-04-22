import path from 'path';

/** Normalize URL to its canonical form */
export function canonicalURL(url: string, base?: string): string {
  return new URL(
    path.extname(url) ? url : url.replace(/(\/+)?$/, '/'), // add trailing slash if there’s no extension
    base
  ).href;
}
