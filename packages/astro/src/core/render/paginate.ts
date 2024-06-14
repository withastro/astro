import type {
	Page,
	PaginateFunction,
	PaginateOptions,
	Params,
	Props,
	RouteData,
} from '../../@types/astro.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { removeTrailingForwardSlash } from '../path.js';

export function generatePaginateFunction(
	routeMatch: RouteData,
	base: string,
): (...args: Parameters<PaginateFunction>) => ReturnType<PaginateFunction> {
	return function paginateUtility(
		data: any[],
		args: PaginateOptions<Props, Params> = {},
	): ReturnType<PaginateFunction> {
		let { pageSize: _pageSize, params: _params, props: _props } = args;
		const pageSize = _pageSize || 10;
		const paramName = 'page';
		const additionalParams = _params || {};
		const additionalProps = _props || {};
		let includesFirstPageNumber: boolean;
		if (routeMatch.params.includes(`...${paramName}`)) {
			includesFirstPageNumber = false;
		} else if (routeMatch.params.includes(`${paramName}`)) {
			includesFirstPageNumber = true;
		} else {
			throw new AstroError({
				...AstroErrorData.PageNumberParamNotFound,
				message: AstroErrorData.PageNumberParamNotFound.message(paramName),
			});
		}
		const lastPage = Math.max(1, Math.ceil(data.length / pageSize));

		const result = [...Array(lastPage).keys()].map((num) => {
			const pageNum = num + 1;
			const start = pageSize === Infinity ? 0 : (pageNum - 1) * pageSize; // currentPage is 1-indexed
			const end = Math.min(start + pageSize, data.length);
			const params = {
				...additionalParams,
				[paramName]: includesFirstPageNumber || pageNum > 1 ? String(pageNum) : undefined,
			};
			const current = addRouteBase(routeMatch.generate({ ...params }), base);
			const next =
				pageNum === lastPage
					? undefined
					: addRouteBase(routeMatch.generate({ ...params, page: String(pageNum + 1) }),  base);
			const prev =
				pageNum === 1
					? undefined
					: addRouteBase(
							routeMatch.generate({
								...params,
								page:
									!includesFirstPageNumber && pageNum - 1 === 1 ? undefined : String(pageNum - 1),
							}), base
						);
			const first =
				pageNum === 1
					? undefined
					: correctIndexRoute(
							routeMatch.generate({
								...params,
								page: includesFirstPageNumber ? '1' : undefined,
							}),
						);
			const last =
				pageNum === lastPage
					? undefined
					: correctIndexRoute(routeMatch.generate({ ...params, page: String(lastPage) }));
			return {
				params,
				props: {
					...additionalProps,
					page: {
						data: data.slice(start, end),
						start,
						end: end - 1,
						size: pageSize,
						total: data.length,
						currentPage: pageNum,
						lastPage: lastPage,
						url: { current, next, prev, first, last },
					} as Page,
				},
			};
		});
		return result;
	};
}

function addRouteBase(route: string, base: string = '/') {
	// `routeMatch.generate` avoids appending `/`
	// unless `trailingSlash: 'always'` is configured.
	// This means an empty string is possible for the index route.
	let routeWithBase = base === '/' ? route : removeTrailingForwardSlash(base) + route;
	if (routeWithBase === '') routeWithBase = '/';
	return routeWithBase;
}
