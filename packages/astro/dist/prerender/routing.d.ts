import type { RouteData, SSRManifest } from '../types/public/internal.js';
type GetSortedPreloadedMatchesParams = {
	matches: RouteData[];
	manifest: SSRManifest;
};
export declare function getSortedPreloadedMatches({
	matches,
	manifest,
}: GetSortedPreloadedMatchesParams): PreloadAndSetPrerenderStatusResult[];
type PreloadAndSetPrerenderStatusResult = {
	filePath: URL;
	route: RouteData;
};
export {};
