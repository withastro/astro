import type { AstroSettings, ComponentInstance, RouteData } from '../@types/astro';
import { RedirectComponentInstance, routeIsRedirect } from '../core/redirects/index.js';
import { preload } from '../vite-plugin-astro-server/index.js';
import { getPrerenderStatus } from './metadata.js';
import type DevPipeline from '../vite-plugin-astro-server/devPipeline';

type GetSortedPreloadedMatchesParams = {
	pipeline: DevPipeline;
	matches: RouteData[];
	settings: AstroSettings;
};
export async function getSortedPreloadedMatches({
	pipeline,
	matches,
	settings,
}: GetSortedPreloadedMatchesParams) {
	return (
		await preloadAndSetPrerenderStatus({
			pipeline,
			matches,
			settings,
		})
	).sort((a, b) => prioritizePrerenderedMatchesComparator(a.route, b.route));
}

type PreloadAndSetPrerenderStatusParams = {
	pipeline: DevPipeline;
	matches: RouteData[];
	settings: AstroSettings;
};

type PreloadAndSetPrerenderStatusResult = {
	filePath: URL;
	route: RouteData;
	preloadedComponent: ComponentInstance;
};

async function preloadAndSetPrerenderStatus({
	pipeline,
	matches,
	settings,
}: PreloadAndSetPrerenderStatusParams): Promise<PreloadAndSetPrerenderStatusResult[]> {
	const preloaded = await Promise.all(
		matches.map(async (route) => {
			const filePath = new URL(`./${route.component}`, settings.config.root);

			if (routeIsRedirect(route)) {
				return {
					preloadedComponent: RedirectComponentInstance,
					route,
					filePath,
				};
			}

			const preloadedComponent = await preload({ pipeline, filePath });

			// gets the prerender metadata set by the `astro:scanner` vite plugin
			const prerenderStatus = getPrerenderStatus({
				filePath,
				loader: pipeline.getModuleLoader(),
			});

			if (prerenderStatus !== undefined) {
				route.prerender = prerenderStatus;
			}

			return { preloadedComponent, route, filePath };
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
