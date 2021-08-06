import { AstroConfig, GetStaticPathsResult, RouteData } from './@types/astro';
import { generateRSS } from './build/rss.js';
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

export function generatePaginateFunction(routeMatch: RouteData) {
  let paginateCallCount = 0;
  return function paginateUtility(data: any[], args: { pageSize?: number; param?: string } = {}) {
    if (paginateCallCount !== 0) {
      throw new Error('[paginate()] cannot call the paginate() function more than once.');
    }
    paginateCallCount++;
    let { pageSize: _pageSize, param: _param } = args;
    const pageSize = _pageSize || 10;
    const paramName = _param || 'page';
    let includesFirstPageNumber: boolean;
    if (routeMatch.params.includes(`...${paramName}`)) {
      includesFirstPageNumber = false;
    } else if (routeMatch.params.includes(`${paramName}`)) {
      includesFirstPageNumber = true;
    } else {
      throw new Error(
        `[paginate()] page number param \`${paramName}\` not found in your filepath.\nRename your file to \`[...page].astro\` or customize the param name via the \`paginate([], {param: '...'}\` option.`
      );
    }
    const lastPage = Math.max(1, Math.ceil(data.length / pageSize));

    const result: GetStaticPathsResult = [...Array(lastPage).keys()].map((num) => {
      const pageNum = num + 1;
      const start = pageSize === Infinity ? 0 : (pageNum - 1) * pageSize; // currentPage is 1-indexed
      const end = Math.min(start + pageSize, data.length);
      const params = {
        [paramName]: includesFirstPageNumber || pageNum > 1 ? String(pageNum) : undefined,
      };
      return {
        params,
        props: {
          page: {
            data: data.slice(start, end),
            start,
            end: end - 1,
            total: data.length,
            page: {
              size: pageSize,
              current: pageNum,
              last: lastPage,
            },
            url: {
              current: routeMatch!.generate({ ...params }),
              next: pageNum === lastPage ? undefined : routeMatch!.generate({ ...params, page: String(pageNum + 1) }),
              prev: pageNum === 1 ? undefined : routeMatch!.generate({ ...params, page: !includesFirstPageNumber && pageNum - 1 === 1 ? undefined : String(pageNum - 1) }),
            },
          },
        },
      };
    });
    return result;
  };
}

export function generateRssFunction(site: string | undefined, routeMatch: RouteData): [Function, {}] {
  if (!site) {
    throw new Error(`[${routeMatch.component}] rss() tried to generate RSS but "buildOptions.site" missing in astro.config.mjs`);
  }
  let result: {} | { url: string; xml: string } = {};
  function rssUtility(rssData: any, args: { url?: string } = {}) {
    const feedURL = args.url || '/rss.xml';
    (result as { url: string; xml: string }).url = feedURL;
    (result as { url: string; xml: string }).xml = generateRSS({ ...(rssData as any), site }, { srcFile: routeMatch.component, feedURL });
  }
  return [rssUtility, result];
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
      if (typeof val !== 'string') {
        warn(logging, 'getStaticPaths', `invalid path param: ${key}. A string value was expected, but got \`${JSON.stringify(val)}\`.`);
      }
      if (val === '') {
        warn(logging, 'getStaticPaths', `invalid path param: ${key}. \`undefined\` expected for an optional param, but got empty string.`);
      }
    }
  });
}
