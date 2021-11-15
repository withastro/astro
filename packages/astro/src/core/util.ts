import type { AstroConfig } from '../@types/astro-core';
import type { ErrorPayload } from 'vite';
import eol from 'eol';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import resolve from 'resolve';

/** Normalize URL to its canonical form */
export function canonicalURL(url: string, base?: string): URL {
  let pathname = url.replace(/\/index.html$/, ''); // index.html is not canonical
  pathname = pathname.replace(/\/1\/?$/, ''); // neither is a trailing /1/ (impl. detail of collections)
  if (!path.extname(pathname)) pathname = pathname.replace(/(\/+)?$/, '/'); // add trailing slash if there’s no extension
  pathname = pathname.replace(/\/+/g, '/'); // remove duplicate slashes (URL() won’t)
  return new URL(pathname, base);
}

/** is a specifier an npm package? */
export function parseNpmName(spec: string): { scope?: string; name: string; subpath?: string } | undefined {
  // not an npm package
  if (!spec || spec[0] === '.' || spec[0] === '/') return undefined;

  let scope: string | undefined;
  let name = '';

  let parts = spec.split('/');
  if (parts[0][0] === '@') {
    scope = parts[0];
    name = parts.shift() + '/';
  }
  name += parts.shift();

  let subpath = parts.length ? `./${parts.join('/')}` : undefined;

  return {
    scope,
    name,
    subpath,
  };
}

/** generate code frame from esbuild error */
export function codeFrame(src: string, loc: ErrorPayload['err']['loc']): string {
  if (!loc) return '';
  const lines = eol.lf(src).split('\n');
  // grab 2 lines before, and 3 lines after focused line
  const visibleLines = [];
  for (let n = -2; n <= 2; n++) {
    if (lines[loc.line + n]) visibleLines.push(loc.line + n);
  }
  // figure out gutter width
  let gutterWidth = 0;
  for (const lineNo of visibleLines) {
    let w = `> ${lineNo}`;
    if (w.length > gutterWidth) gutterWidth = w.length;
  }
  // print lines
  let output = '';
  for (const lineNo of visibleLines) {
    const isFocusedLine = lineNo === loc.line - 1;
    output += isFocusedLine ? '> ' : '  ';
    output += `${lineNo + 1} | ${lines[lineNo]}\n`;
    if (isFocusedLine) output += `${[...new Array(gutterWidth)].join(' ')}  | ${[...new Array(loc.column)].join(' ')}^\n`;
  }
  return output;
}

export function resolveDependency(dep: string, astroConfig: AstroConfig) {
  const resolved = resolve.sync(dep, {
    basedir: fileURLToPath(astroConfig.projectRoot),
  });
  // For Windows compat, we need a fully resolved `file://` URL string
  return pathToFileURL(resolved).toString();
}

export function viteifyPath(pathname: string): string {
  return `/@fs/${pathname.replace(/^\//, '')}`;
}
