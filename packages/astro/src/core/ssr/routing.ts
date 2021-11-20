import type { AstroConfig, ComponentInstance, GetStaticPathsResult, ManifestData, Params, RouteData } from '../../@types/astro';
import type { LogOptions } from '../logger';

import fs from 'fs';
import path from 'path';
import { compile } from 'path-to-regexp';
import slash from 'slash';
import { fileURLToPath } from 'url';
import { warn } from '../logger.js';

/**
 * given an array of params like `['x', 'y', 'z']` for
 * src/routes/[x]/[y]/[z]/svelte, create a function
 * that turns a RegExpExecArray into ({ x, y, z })
 */
export function getParams(array: string[]) {
  const fn = (match: RegExpExecArray) => {
    const params: Params = {};
    array.forEach((key, i) => {
      if (key.startsWith('...')) {
        params[key.slice(3)] = match[i + 1] ? decodeURIComponent(match[i + 1]) : undefined;
      } else {
        params[key] = decodeURIComponent(match[i + 1]);
      }
    });
    return params;
  };

  return fn;
}

/** Find matching route from pathname */
export function matchRoute(pathname: string, manifest: ManifestData): RouteData | undefined {
  return manifest.routes.find((route) => route.pattern.test(pathname));
}

/** Throw error for deprecated/malformed APIs */
export function validateGetStaticPathsModule(mod: ComponentInstance) {
  if ((mod as any).createCollection) {
    throw new Error(`[createCollection] deprecated. Please use getStaticPaths() instead.`);
  }
  if (!mod.getStaticPaths) {
    throw new Error(`[getStaticPaths] getStaticPaths() function is required. Make sure that you \`export\` the function from your component.`);
  }
}

/** Throw error for malformed getStaticPaths() response */
export function validateGetStaticPathsResult(result: GetStaticPathsResult, logging: LogOptions) {
  if (!Array.isArray(result)) {
    throw new Error(`[getStaticPaths] invalid return value. Expected an array of path objects, but got \`${JSON.stringify(result)}\`.`);
  }
  result.forEach((pathObject) => {
    if (!pathObject.params) {
      warn(logging, 'getStaticPaths', `invalid path object. Expected an object with key \`params\`, but got \`${JSON.stringify(pathObject)}\`. Skipped.`);
      return;
    }
    for (const [key, val] of Object.entries(pathObject.params)) {
      if (!(typeof val === 'undefined' || typeof val === 'string')) {
        warn(logging, 'getStaticPaths', `invalid path param: ${key}. A string value was expected, but got \`${JSON.stringify(val)}\`.`);
      }
      if (val === '') {
        warn(logging, 'getStaticPaths', `invalid path param: ${key}. \`undefined\` expected for an optional param, but got empty string.`);
      }
    }
  });
}

interface Part {
  content: string;
  dynamic: boolean;
  spread: boolean;
}

interface Item {
  basename: string;
  ext: string;
  parts: Part[];
  file: string;
  isDir: boolean;
  isIndex: boolean;
  isPage: boolean;
  routeSuffix: string;
}

/** Create manifest of all static routes */
export function createRouteManifest({ config, cwd }: { config: AstroConfig; cwd?: string }): ManifestData {
  const components: string[] = [];
  const routes: RouteData[] = [];

  function walk(dir: string, parentSegments: Part[][], parentParams: string[]) {
    let items: Item[] = [];
    fs.readdirSync(dir).forEach((basename) => {
      const resolved = path.join(dir, basename);
      const file = slash(path.relative(cwd || fileURLToPath(config.projectRoot), resolved));
      const isDir = fs.statSync(resolved).isDirectory();

      const ext = path.extname(basename);
      const name = ext ? basename.slice(0, -ext.length) : basename;

      if (name[0] === '_') {
        return;
      }
      if (basename[0] === '.' && basename !== '.well-known') {
        return;
      }
      // filter out "foo.astro_tmp" files, etc
      if (!isDir && !/^(\.[a-z0-9]+)+$/i.test(ext)) {
        return;
      }
      const segment = isDir ? basename : name;
      if (/^\$/.test(segment)) {
        throw new Error(`Invalid route ${file} — Astro's Collections API has been replaced by dynamic route params.`);
      }
      if (/\]\[/.test(segment)) {
        throw new Error(`Invalid route ${file} — parameters must be separated`);
      }
      if (countOccurrences('[', segment) !== countOccurrences(']', segment)) {
        throw new Error(`Invalid route ${file} — brackets are unbalanced`);
      }
      if (/.+\[\.\.\.[^\]]+\]/.test(segment) || /\[\.\.\.[^\]]+\].+/.test(segment)) {
        throw new Error(`Invalid route ${file} — rest parameter must be a standalone segment`);
      }

      const parts = getParts(segment, file);
      const isIndex = isDir ? false : basename.startsWith('index.');
      const routeSuffix = basename.slice(basename.indexOf('.'), -ext.length);

      items.push({
        basename,
        ext,
        parts,
        file: slash(file),
        isDir,
        isIndex,
        isPage: true,
        routeSuffix,
      });
    });
    items = items.sort(comparator);

    items.forEach((item) => {
      const segments = parentSegments.slice();

      if (item.isIndex) {
        if (item.routeSuffix) {
          if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1].slice();
            const lastPart = lastSegment[lastSegment.length - 1];

            if (lastPart.dynamic) {
              lastSegment.push({
                dynamic: false,
                spread: false,
                content: item.routeSuffix,
              });
            } else {
              lastSegment[lastSegment.length - 1] = {
                dynamic: false,
                spread: false,
                content: `${lastPart.content}${item.routeSuffix}`,
              };
            }

            segments[segments.length - 1] = lastSegment;
          } else {
            segments.push(item.parts);
          }
        }
      } else {
        segments.push(item.parts);
      }

      const params = parentParams.slice();
      params.push(...item.parts.filter((p) => p.dynamic).map((p) => p.content));

      if (item.isDir) {
        walk(path.join(dir, item.basename), segments, params);
      } else {
        components.push(item.file);
        const component = item.file;
        const pattern = getPattern(segments, config.devOptions.trailingSlash);
        const generate = getGenerator(segments, config.devOptions.trailingSlash);
        const pathname = segments.every((segment) => segment.length === 1 && !segment[0].dynamic) ? `/${segments.map((segment) => segment[0].content).join('/')}` : null;

        routes.push({
          type: 'page',
          pattern,
          params,
          component,
          generate,
          pathname: pathname || undefined,
        });
      }
    });
  }

  walk(fileURLToPath(config.pages), [], []);

  return {
    routes,
  };
}

function countOccurrences(needle: string, haystack: string) {
  let count = 0;
  for (let i = 0; i < haystack.length; i += 1) {
    if (haystack[i] === needle) count += 1;
  }
  return count;
}

function isSpread(str: string) {
  const spreadPattern = /\[\.{3}/g;
  return spreadPattern.test(str);
}

function comparator(a: Item, b: Item) {
  if (a.isIndex !== b.isIndex) {
    if (a.isIndex) return isSpread(a.file) ? 1 : -1;

    return isSpread(b.file) ? -1 : 1;
  }

  const max = Math.max(a.parts.length, b.parts.length);

  for (let i = 0; i < max; i += 1) {
    const aSubPart = a.parts[i];
    const bSubPart = b.parts[i];

    if (!aSubPart) return 1; // b is more specific, so goes first
    if (!bSubPart) return -1;

    // if spread && index, order later
    if (aSubPart.spread && bSubPart.spread) {
      return a.isIndex ? 1 : -1;
    }

    // If one is ...spread order it later
    if (aSubPart.spread !== bSubPart.spread) return aSubPart.spread ? 1 : -1;

    if (aSubPart.dynamic !== bSubPart.dynamic) {
      return aSubPart.dynamic ? 1 : -1;
    }

    if (!aSubPart.dynamic && aSubPart.content !== bSubPart.content) {
      return bSubPart.content.length - aSubPart.content.length || (aSubPart.content < bSubPart.content ? -1 : 1);
    }
  }

  if (a.isPage !== b.isPage) {
    return a.isPage ? 1 : -1;
  }

  // otherwise sort alphabetically
  return a.file < b.file ? -1 : 1;
}

function getParts(part: string, file: string) {
  const result: Part[] = [];
  part.split(/\[(.+?\(.+?\)|.+?)\]/).map((str, i) => {
    if (!str) return;
    const dynamic = i % 2 === 1;

    const [, content] = dynamic ? /([^(]+)$/.exec(str) || [null, null] : [null, str];

    if (!content || (dynamic && !/^(\.\.\.)?[a-zA-Z0-9_$]+$/.test(content))) {
      throw new Error(`Invalid route ${file} — parameter name must match /^[a-zA-Z0-9_$]+$/`);
    }

    result.push({
      content,
      dynamic,
      spread: dynamic && /^\.{3}.+$/.test(content),
    });
  });

  return result;
}

function getTrailingSlashPattern(addTrailingSlash: AstroConfig['devOptions']['trailingSlash']): string {
  if (addTrailingSlash === 'always') {
    return '\\/$';
  }
  if (addTrailingSlash === 'never') {
    return '$';
  }
  return '\\/?$';
}

function getPattern(segments: Part[][], addTrailingSlash: AstroConfig['devOptions']['trailingSlash']) {
  const pathname = segments
    .map((segment) => {
      return segment[0].spread
        ? '(?:\\/(.*?))?'
        : '\\/' +
            segment
              .map((part) => {
                if (part)
                  return part.dynamic
                    ? '([^/]+?)'
                    : part.content
                        .normalize()
                        .replace(/\?/g, '%3F')
                        .replace(/#/g, '%23')
                        .replace(/%5B/g, '[')
                        .replace(/%5D/g, ']')
                        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              })
              .join('');
    })
    .join('');

  const trailing = addTrailingSlash && segments.length ? getTrailingSlashPattern(addTrailingSlash) : '$';
  return new RegExp(`^${pathname || '\\/'}${trailing}`);
}

function getGenerator(segments: Part[][], addTrailingSlash: AstroConfig['devOptions']['trailingSlash']) {
  const template = segments
    .map((segment) => {
      return segment[0].spread
        ? `/:${segment[0].content.substr(3)}(.*)?`
        : '/' +
            segment
              .map((part) => {
                if (part)
                  return part.dynamic
                    ? `:${part.content}`
                    : part.content
                        .normalize()
                        .replace(/\?/g, '%3F')
                        .replace(/#/g, '%23')
                        .replace(/%5B/g, '[')
                        .replace(/%5D/g, ']')
                        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              })
              .join('');
    })
    .join('');

  const trailing = addTrailingSlash !== 'never' && segments.length ? '/' : '';
  const toPath = compile(template + trailing);
  return toPath;
}
