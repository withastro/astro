import { AstroError, AstroErrorData } from '../errors/index.js';
import { joinPaths } from '../path.js';
import { getRouteGenerator } from '../routing/generator.js';
function generatePaginateFunction(routeMatch, base, trailingSlash) {
	return function paginateUtility(data, args = {}) {
		const generate = getRouteGenerator(routeMatch.segments, trailingSlash);
		let { pageSize: _pageSize, params: _params, props: _props } = args;
		const pageSize = _pageSize || 10;
		const paramName = 'page';
		const additionalParams = _params || {};
		const additionalProps = _props || {};
		let includesFirstPageNumber;
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
			const start = pageSize === Number.POSITIVE_INFINITY ? 0 : (pageNum - 1) * pageSize;
			const end = Math.min(start + pageSize, data.length);
			const params = {
				...additionalParams,
				[paramName]: includesFirstPageNumber || pageNum > 1 ? String(pageNum) : void 0,
			};
			const current = addRouteBase(generate({ ...params }), base);
			const next =
				pageNum === lastPage
					? void 0
					: addRouteBase(generate({ ...params, page: String(pageNum + 1) }), base);
			const prev =
				pageNum === 1
					? void 0
					: addRouteBase(
							generate({
								...params,
								page: !includesFirstPageNumber && pageNum - 1 === 1 ? void 0 : String(pageNum - 1),
							}),
							base,
						);
			const first =
				pageNum === 1
					? void 0
					: addRouteBase(
							generate({
								...params,
								page: includesFirstPageNumber ? '1' : void 0,
							}),
							base,
						);
			const last =
				pageNum === lastPage
					? void 0
					: addRouteBase(generate({ ...params, page: String(lastPage) }), base);
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
						lastPage,
						url: { current, next, prev, first, last },
					},
				},
			};
		});
		return result;
	};
}
function addRouteBase(route, base) {
	let routeWithBase = joinPaths(base, route);
	if (routeWithBase === '') routeWithBase = '/';
	return routeWithBase;
}
export { generatePaginateFunction };
