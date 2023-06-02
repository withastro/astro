import type { AstroSettings, RouteData } from '../@types/astro';
import { preload, type DevelopmentEnvironment } from '../core/render/dev/index.js';
import { getPrerenderStatus } from './metadata.js';

type GetSortedPreloadedMatchesParams = {
	env: DevelopmentEnvironment;
	matches: RouteData[];
	settings: AstroSettings;
};
export async function getSortedPreloadedMatches({
	env,
	matches,
	settings,
}: GetSortedPreloadedMatchesParams) {
	return (
		await preloadAndSetPrerenderStatus({
			env,
			matches,
			settings,
		})
	).sort((a, b) => prioritizePrerenderedMatchesComparator(a.route, b.route));
}

type PreloadAndSetPrerenderStatusParams = {
	env: DevelopmentEnvironment;
	matches: RouteData[];
	settings: AstroSettings;
};
async function preloadAndSetPrerenderStatus({
	env,
	matches,
	settings,
}: PreloadAndSetPrerenderStatusParams) {
	const preloaded = await Promise.all(
		matches.map(async (route) => {
			const filePath = new URL(`./${route.component}`, settings.config.root);
			const preloadedComponent = await preload({ env, filePath });

			// gets the prerender metadata set by the `astro:scanner` vite plugin
			const prerenderStatus = getPrerenderStatus({
				filePath,
				loader: env.loader,
			});

			if (prerenderStatus !== undefined) {
				route.prerender = prerenderStatus;
			}

			return { preloadedComponent, route, filePath } as const;
		})
	);
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
