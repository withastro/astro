import type {
	GetStaticPathsResult,
	Page,
	PaginateFunction,
	Params,
	Props,
	RouteData,
} from '../../@types/astro';
import { AstroError, AstroErrorData } from '../errors/index.js';

export function generatePaginateFunction(routeMatch: RouteData): PaginateFunction {
	return function paginateUtility(
		data: any[],
		args: { pageSize?: number; params?: Params; props?: Props } = {}
	) {
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

		const result: GetStaticPathsResult = [...Array(lastPage).keys()].map((num) => {
			const pageNum = num + 1;
			const start = pageSize === Infinity ? 0 : (pageNum - 1) * pageSize; // currentPage is 1-indexed
			const end = Math.min(start + pageSize, data.length);
			const params = {
				...additionalParams,
				[paramName]: includesFirstPageNumber || pageNum > 1 ? String(pageNum) : undefined,
			};
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
						url: {
							current: routeMatch.generate({ ...params }),
							next:
								pageNum === lastPage
									? undefined
									: routeMatch.generate({ ...params, page: String(pageNum + 1) }),
							prev:
								pageNum === 1
									? undefined
									: routeMatch.generate({
											...params,
											page:
												!includesFirstPageNumber && pageNum - 1 === 1 ? '' : String(pageNum - 1),
									  }),
						},
					} as Page,
				},
			};
		});
		return result;
	};
}
