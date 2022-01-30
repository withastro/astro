import type { ComponentInstance, GetStaticPathsOptions, GetStaticPathsResult, RouteCache, RouteData, GetStaticPathsItem, GetStaticPathsResultKeyed, GetStaticPathsResultObject } from '../../@types/astro';
import type { LogOptions } from '../logger';

import { debug } from '../logger.js';
import { generatePaginateFunction } from '../ssr/paginate.js';
import { createNewFetchContentFn } from '../../runtime/server/content.js';

export async function callGetStaticPaths(filePath: URL, mod: ComponentInstance, route: RouteData, loadContent: (filePath: string) => Promise<any>): Promise<GetStaticPathsResultObject> {
	let result: GetStaticPathsResultObject = {
		filePath,
		rss: undefined,
		// @ts-expect-error
		staticPaths: undefined,
		linkedContent: [],
	};
	let staticPaths: GetStaticPathsResult = [];
	const newFetchContentFn = createNewFetchContentFn(filePath, mod, loadContent);
	await (
		await mod.getStaticPaths!({
			content: async (globStr, filter) => {
				const [fetchContentResults, linkedContentIds] = await newFetchContentFn(globStr, filter);
				result.linkedContent.push(...linkedContentIds);
				return fetchContentResults;
			},
			paginate: generatePaginateFunction(route),
			buildStaticPaths: (result) => {
				staticPaths = result;
			},
			rss: (fn) => {
				result.rss = fn;
			},
		})
	);

	const keyedStaticPaths: GetStaticPathsResultKeyed = (staticPaths || []) as any;
	keyedStaticPaths.keyed = new Map<string, GetStaticPathsItem>();
	for (const sp of keyedStaticPaths) {
		const paramsKey = JSON.stringify(sp.params);
		keyedStaticPaths.keyed.set(paramsKey, sp);
	}
	result.staticPaths = keyedStaticPaths;

	return result;
}


export function findPathItemByKey(staticPaths: GetStaticPathsResultKeyed, paramsKey: string, logging: LogOptions) {
	let matchedStaticPath = staticPaths.keyed.get(paramsKey);
	if (matchedStaticPath) {
		return matchedStaticPath;
	}

	debug(logging, 'findPathItemByKey', `Unexpected cache miss looking for ${paramsKey}`);
	matchedStaticPath = staticPaths.find(({ params: _params }) => JSON.stringify(_params) === paramsKey);
}
