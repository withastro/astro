import { GetStaticPathsResult, RouteData } from '../@types/astro';

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
            size: pageSize,
            total: data.length,
            currentPage: pageNum,
            lastPage: lastPage,
            url: {
              current: routeMatch.generate({ ...params }),
              next: pageNum === lastPage ? undefined : routeMatch.generate({ ...params, page: String(pageNum + 1) }),
              prev: pageNum === 1 ? undefined : routeMatch.generate({ ...params, page: !includesFirstPageNumber && pageNum - 1 === 1 ? undefined : String(pageNum - 1) }),
            },
          },
        },
      };
    });
    return result;
  };
}
