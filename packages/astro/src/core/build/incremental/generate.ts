import nodeFs from 'node:fs';
import type { AstroSettings } from '../../../types/astro.js';
import type { RouteData } from '../../../types/public/internal.js';
import { routeIsRedirect } from '../../routing/helpers.js';
import { getOutFile, getOutFolder } from '../common.js';
import { type BuildInternals, recordGeneratedPagePath } from '../internal.js';
import { makePageDataKey } from '../plugins/util.js';
import type { StaticBuildOptions } from '../types.js';
import { shouldAppendForwardSlash } from '../util.js';
import type { IncrementalBuildGeneratedPath, IncrementalBuildRenderPlan } from './types.js';

export function addPageName(pathname: string, opts: StaticBuildOptions): void {
	const trailingSlash = opts.settings.config.trailingSlash;
	const buildFormat = opts.settings.config.build.format;
	const pageName = shouldAppendForwardSlash(trailingSlash, buildFormat)
		? pathname.replace(/\/?$/, '/').replace(/^\//, '')
		: pathname.replace(/^\//, '');
	opts.pageNames.push(pageName);
}

export function createPlannedGeneratedPaths(
	filteredPaths: Array<{ pathname: string; route: RouteData }>,
	options: StaticBuildOptions,
): Map<string, IncrementalBuildGeneratedPath[]> {
	const generatedPathsByPage = new Map<string, IncrementalBuildGeneratedPath[]>();

	for (const { pathname, route } of filteredPaths) {
		const pageKey = makePageDataKey(route.route, route.component);
		const generatedPath = {
			pathname,
			output: getPlannedGeneratedOutput(pathname, route, options),
		};
		if (generatedPathsByPage.has(pageKey)) {
			generatedPathsByPage.get(pageKey)!.push(generatedPath);
		} else {
			generatedPathsByPage.set(pageKey, [generatedPath]);
		}
	}

	for (const generatedPaths of generatedPathsByPage.values()) {
		generatedPaths.sort((left, right) => left.pathname.localeCompare(right.pathname));
	}

	return generatedPathsByPage;
}

export function shouldSkipIncrementalPath(
	pathname: string,
	route: RouteData,
	incrementalRenderPlan: IncrementalBuildRenderPlan | undefined,
	options: StaticBuildOptions,
): boolean {
	if (!incrementalRenderPlan) {
		return false;
	}
	const pageKey = makePageDataKey(route.route, route.component);
	const pagePlan = incrementalRenderPlan.pagePlans.get(pageKey);
	if (!pagePlan || pagePlan.renderPathnames.includes(pathname)) {
		return false;
	}
	const plannedOutput = getPlannedGeneratedOutput(pathname, route, options);
	return plannedOutput ? nodeFs.existsSync(new URL(plannedOutput)) : false;
}

export async function deleteIncrementalOutputs(outputs: string[]) {
	for (const output of outputs) {
		await nodeFs.promises.rm(new URL(output), { force: true });
	}
}

export function recordIncrementalReusedPath(
	pathname: string,
	route: RouteData,
	options: StaticBuildOptions,
	internals: BuildInternals,
) {
	if (route.type === 'page') {
		addPageName(pathname, options);
	}
	const output = getPlannedGeneratedOutput(pathname, route, options);
	recordGeneratedPagePath(
		internals,
		makePageDataKey(route.route, route.component),
		pathname,
		output,
	);
	if (!output) {
		return;
	}
	if (route.distURL) {
		route.distURL.push(new URL(output));
	} else {
		route.distURL = [new URL(output)];
	}
}

export function hasPublicConflict(outFile: URL, settings: AstroSettings): boolean {
	const outRoot =
		settings.buildOutput === 'static' && !settings.adapter?.adapterFeatures?.preserveBuildClientDir
			? settings.config.outDir
			: settings.config.build.client;

	const relativePath = outFile.href.slice(outRoot.href.length);
	const publicFileUrl = new URL(relativePath, settings.config.publicDir);
	return nodeFs.existsSync(publicFileUrl);
}

function getPlannedGeneratedOutput(
	pathname: string,
	route: RouteData,
	options: StaticBuildOptions,
): string | null {
	if (routeIsRedirect(route) && !options.settings.config.build.redirects) {
		return null;
	}
	const encodedPath = encodeURI(pathname);
	const outFolder = getOutFolder(options.settings, encodedPath, route);
	const outFile = getOutFile(options.settings.config.build.format, outFolder, encodedPath, route);
	return hasPublicConflict(outFile, options.settings) ? null : outFile.toString();
}
