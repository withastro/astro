import { routeIsRedirect } from '../core/routing/index.js';
import { routeComparator } from '../core/routing/priority.js';
import type { RouteData, SSRManifest } from '../types/public/internal.js';
import type { RunnablePipeline } from '../vite-plugin-app/pipeline.js';

type GetSortedPreloadedMatchesParams = {
	pipeline: RunnablePipeline;
	matches: RouteData[];
	manifest: SSRManifest;
};
export async function getSortedPreloadedMatches({
	pipeline,
	matches,
	manifest,
}: GetSortedPreloadedMatchesParams) {
	return (
		await preloadAndSetPrerenderStatus({
			pipeline,
			matches,
			manifest,
		})
	)
		.sort((a, b) => routeComparator(a.route, b.route))
		.sort((a, b) => prioritizePrerenderedMatchesComparator(a.route, b.route));
}

type PreloadAndSetPrerenderStatusParams = {
	pipeline: RunnablePipeline;
	matches: RouteData[];
	manifest: SSRManifest;
};

type PreloadAndSetPrerenderStatusResult = {
	filePath: URL;
	route: RouteData;
};

async function preloadAndSetPrerenderStatus({
	matches,
	manifest,
}: PreloadAndSetPrerenderStatusParams): Promise<PreloadAndSetPrerenderStatusResult[]> {
	const preloaded = new Array<PreloadAndSetPrerenderStatusResult>();
	for (const route of matches) {
		const filePath = new URL(`./${route.component}`, manifest.rootDir);
		if (routeIsRedirect(route)) {
			preloaded.push({
				route,
				filePath,
			});
			continue;
		}

		preloaded.push({ route, filePath });
	}
	return preloaded;
}

function prioritizePrerenderedMatchesComparator(a: RouteData, b: RouteData): number {
	if (areRegexesEqual(a.pattern, b.pattern)) {
		if (a.prerender !== b.prerender) {
			return a.prerender ? -1 : 1;
		}
		return a.component < b.component ? -1 : 1;
	}
	return 0;
}

function areRegexesEqual(regexp1: RegExp, regexp2: RegExp) {
	return regexp1.source === regexp2.source && regexp1.global === regexp2.global;
}
