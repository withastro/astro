import { extname } from 'path';
import { AstroRuntimeConfig } from './runtime';
import { RouteConfigObject, SnowpackConfig } from 'snowpack';
import { AstroConfig, GetStaticPathsResult, RouteData } from './@types/astro';
import { LogOptions, warn } from './logger.js';

interface PageLocation {
  fileURL: URL;
  snowpackURL: string;
}

/** convertMatchToLocation and return the _astro candidate for snowpack */
export function convertMatchToLocation(routeMatch: RouteData, astroConfig: AstroConfig): PageLocation {
  const url = new URL(`./${routeMatch.component}`, astroConfig.projectRoot);
  return {
    fileURL: url,
    snowpackURL: `/_astro/${routeMatch.component}.js`,
  };
}

export function validateGetStaticPathsModule(mod: any) {
  if (mod.exports.createCollection) {
    throw new Error(`[createCollection] deprecated. Please use getStaticPaths() instead.`);
  }
  if (!mod.exports.getStaticPaths) {
    throw new Error(`[getStaticPaths] getStaticPaths() function is required. Make sure that you \`export\` the function from your component.`);
  }
}

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

/** Add / to beginning of string (but don’t double-up) */
export function addLeadingSlash(path: string) {
  return path.replace(/^\/?/, '/');
}

/** Add / to the end of string (but don’t double-up) */
export function addTrailingSlash(path: string) {
  return path.replace(/\/?$/, '/');
}

/** Astro adaption of function with the same name in `https://github.com/snowpackjs/snowpack/blob/main/snowpack/src/commands/dev.ts` */
export function matchRouteHandler(astroRuntimeConfig: AstroRuntimeConfig, reqUrl: string, expectHandler: 'dest'): RouteConfigObject['dest'] | null;
export function matchRouteHandler(astroRuntimeConfig: AstroRuntimeConfig, reqUrl: string, expectHandler: 'upgrade'): RouteConfigObject['upgrade'] | null;
export function matchRouteHandler(
  astroRuntimeConfig: AstroRuntimeConfig,
  reqUrl: string,
  expectHandler: 'dest' | 'upgrade'
): RouteConfigObject['dest'] | RouteConfigObject['upgrade'] | null {
  const { snowpackConfig, astroConfig } = astroRuntimeConfig;
  if (reqUrl.startsWith(snowpackConfig.buildOptions.metaUrlPath)) {
    return null;
  }
  const { hostname, port } = astroConfig.devOptions;
  const reqPath = decodeURI(new URL(reqUrl, astroConfig.buildOptions.site || `http://${hostname}:${port}`).pathname!);
  const matchOutputExt = getOutputExtensionMatch(snowpackConfig);
  const reqExt = matchOutputExt(reqPath);
  const isRoute = !reqExt || reqExt.toLowerCase() === '.html';
  for (const route of snowpackConfig.routes) {
    if (route.match === 'routes' && !isRoute) {
      continue;
    }
    if (!route[expectHandler]) {
      continue;
    }
    if (route._srcRegex.test(reqPath)) {
      return route[expectHandler];
    }
  }
  return null;
}

function getOutputExtensionMatch(config: SnowpackConfig) {
  let outputExts: string[] = [];
  for (const plugin of config.plugins) {
    if (plugin.resolve) {
      for (const outputExt of plugin.resolve.output) {
        const ext = outputExt.toLowerCase();
        if (!outputExts.includes(ext)) {
          outputExts.push(ext);
        }
      }
    }
  }
  outputExts = outputExts.sort((a, b) => b.split('.').length - a.split('.').length);

  return (base: string): string => {
    const basename = base.toLowerCase();
    for (const ext of outputExts) {
      if (basename.endsWith(ext)) return ext;
    }
    return extname(basename);
  };
}
