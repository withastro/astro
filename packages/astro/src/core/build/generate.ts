import fs from 'fs';
import { bgGreen, bgMagenta, black, cyan, dim, green, magenta } from 'kleur/colors';
import npath from 'path';
import type { OutputAsset, OutputChunk, RollupOutput } from 'rollup';
import { fileURLToPath } from 'url';
import type { AstroConfig, ComponentInstance, EndpointHandler, SSRLoadedRenderer } from '../../@types/astro';
import type { BuildInternals } from '../../core/build/internal.js';
import { debug, info } from '../logger/core.js';
import { appendForwardSlash, prependForwardSlash } from '../../core/path.js';
import type { RenderOptions } from '../../core/render/core';
import { BEFORE_HYDRATION_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import { call as callEndpoint } from '../endpoint/index.js';
import { render } from '../render/core.js';
import { createLinkStylesheetElementSet, createModuleScriptElementWithSrcSet } from '../render/ssr-element.js';
import { getOutputFilename } from '../util.js';
import { getOutFile, getOutFolder } from './common.js';
import { eachPageData, getPageDataByComponent } from './internal.js';
import type { PageBuildData, SingleFileBuiltModule, StaticBuildOptions } from './types';
import { getTimeStat } from './util.js';
import { createRequest } from '../request.js';

// Render is usually compute, which Node.js can't parallelize well.
// In real world testing, dropping from 10->1 showed a notiable perf
// improvement. In the future, we can revisit a smarter parallel
// system, possibly one that parallelizes if async IO is detected.
const MAX_CONCURRENT_RENDERS = 1;

// Throttle the rendering a paths to prevents creating too many Promises on the microtask queue.
function* throttle(max: number, inPaths: string[]) {
	let tmp = [];
	let i = 0;
	for (let path of inPaths) {
		tmp.push(path);
		if (i === max) {
			yield tmp;
			// Empties the array, to avoid allocating a new one.
			tmp.length = 0;
			i = 0;
		} else {
			i++;
		}
	}

	// If tmp has items in it, that means there were less than {max} paths remaining
	// at the end, so we need to yield these too.
	if (tmp.length) {
		yield tmp;
	}
}

// Gives back a facadeId that is relative to the root.
// ie, src/pages/index.astro instead of /Users/name..../src/pages/index.astro
export function rootRelativeFacadeId(facadeId: string, astroConfig: AstroConfig): string {
	return facadeId.slice(fileURLToPath(astroConfig.projectRoot).length);
}

// Determines of a Rollup chunk is an entrypoint page.
export function chunkIsPage(astroConfig: AstroConfig, output: OutputAsset | OutputChunk, internals: BuildInternals) {
	if (output.type !== 'chunk') {
		return false;
	}
	const chunk = output as OutputChunk;
	if (chunk.facadeModuleId) {
		const facadeToEntryId = prependForwardSlash(rootRelativeFacadeId(chunk.facadeModuleId, astroConfig));
		return internals.entrySpecifierToBundleMap.has(facadeToEntryId);
	}
	return false;
}

export async function generatePages(result: RollupOutput, opts: StaticBuildOptions, internals: BuildInternals, facadeIdToPageDataMap: Map<string, PageBuildData>) {
	const timer = performance.now();
	info(opts.logging, null, `\n${bgGreen(black(' generating static routes '))}`);

	const ssr = !!opts.astroConfig._ctx.adapter?.serverEntrypoint;
	const serverEntry = opts.buildConfig.serverEntry;
	const outFolder = ssr ? opts.buildConfig.server : opts.astroConfig.dist;
	const ssrEntryURL = new URL('./' + serverEntry + `?time=${Date.now()}`, outFolder);
	const ssrEntry = await import(ssrEntryURL.toString());

	for (const pageData of eachPageData(internals)) {
		await generatePage(opts, internals, pageData, ssrEntry);
	}
	info(opts.logging, null, dim(`Completed in ${getTimeStat(timer, performance.now())}.\n`));
}

async function generatePage(
	//output: OutputChunk,
	opts: StaticBuildOptions,
	internals: BuildInternals,
	pageData: PageBuildData,
	ssrEntry: SingleFileBuiltModule
) {
	let timeStart = performance.now();
	const renderers = ssrEntry.renderers;

	const pageInfo = getPageDataByComponent(internals, pageData.route.component);
	const linkIds: string[] = Array.from(pageInfo?.css ?? []);
	const hoistedId = pageInfo?.hoistedScript ?? null;

	const pageModule = ssrEntry.pageMap.get(pageData.component);

	if (!pageModule) {
		throw new Error(`Unable to find the module for ${pageData.component}. This is unexpected and likely a bug in Astro, please report.`);
	}

	const generationOptions: Readonly<GeneratePathOptions> = {
		pageData,
		internals,
		linkIds,
		hoistedId,
		mod: pageModule,
		renderers,
	};

	const icon = pageData.route.type === 'page' ? green('▶') : magenta('λ');
	info(opts.logging, null, `${icon} ${pageData.route.component}`);

	for (let i = 0; i < pageData.paths.length; i++) {
		const path = pageData.paths[i];
		await generatePath(path, opts, generationOptions);
		const timeEnd = performance.now();
		const timeChange = getTimeStat(timeStart, timeEnd);
		const timeIncrease = `(+${timeChange})`;
		const filePath = getOutputFilename(opts.astroConfig, path);
		const lineIcon = i === pageData.paths.length - 1 ? '└─' : '├─';
		info(opts.logging, null, `  ${cyan(lineIcon)} ${dim(filePath)} ${dim(timeIncrease)}`);
	}
}

interface GeneratePathOptions {
	pageData: PageBuildData;
	internals: BuildInternals;
	linkIds: string[];
	hoistedId: string | null;
	mod: ComponentInstance;
	renderers: SSRLoadedRenderer[];
}

function addPageName(pathname: string, opts: StaticBuildOptions): void {
	opts.pageNames.push(pathname.replace(/\/?$/, '/').replace(/^\//, ''));
}

async function generatePath(pathname: string, opts: StaticBuildOptions, gopts: GeneratePathOptions) {
	const { astroConfig, logging, origin, routeCache } = opts;
	const { mod, internals, linkIds, hoistedId, pageData, renderers } = gopts;

	// This adds the page name to the array so it can be shown as part of stats.
	if (pageData.route.type === 'page') {
		addPageName(pathname, opts);
	}

	debug('build', `Generating: ${pathname}`);

	const site = astroConfig.buildOptions.site;
	const links = createLinkStylesheetElementSet(linkIds.reverse(), site);
	const scripts = createModuleScriptElementWithSrcSet(hoistedId ? [hoistedId] : [], site);

	// Add all injected scripts to the page.
	for (const script of astroConfig._ctx.scripts) {
		if (script.stage === 'head-inline') {
			scripts.add({
				props: {},
				children: script.content,
			});
		}
	}

	const url = new URL(origin + pathname);
	const options: RenderOptions = {
		legacyBuild: false,
		links,
		logging,
		markdownRender: astroConfig.markdownOptions.render,
		mod,
		origin,
		pathname,
		scripts,
		renderers,
		async resolve(specifier: string) {
			const hashedFilePath = internals.entrySpecifierToBundleMap.get(specifier);
			if (typeof hashedFilePath !== 'string') {
				// If no "astro:scripts/before-hydration.js" script exists in the build,
				// then we can assume that no before-hydration scripts are needed.
				// Return this as placeholder, which will be ignored by the browser.
				// TODO: In the future, we hope to run this entire script through Vite,
				// removing the need to maintain our own custom Vite-mimic resolve logic.
				if (specifier === BEFORE_HYDRATION_SCRIPT_ID) {
					return 'data:text/javascript;charset=utf-8,//[no before-hydration script]';
				}
				throw new Error(`Cannot find the built path for ${specifier}`);
			}
			const relPath = npath.posix.relative(pathname, '/' + hashedFilePath);
			const fullyRelativePath = relPath[0] === '.' ? relPath : './' + relPath;
			return fullyRelativePath;
		},
		request: createRequest({ url, headers: new Headers(), logging }),
		route: pageData.route,
		routeCache,
		site: astroConfig.buildOptions.site,
		ssr: opts.astroConfig.buildOptions.experimentalSsr,
	};

	let body: string;
	if (pageData.route.type === 'endpoint') {
		const result = await callEndpoint(mod as unknown as EndpointHandler, options);

		if (result.type === 'response') {
			throw new Error(`Returning a Response from an endpoint is not supported in SSG mode.`);
		}
		body = result.body;
	} else {
		const result = await render(options);

		// If there's a redirect or something, just do nothing.
		if (result.type !== 'html') {
			return;
		}
		body = result.html;
	}

	const outFolder = getOutFolder(astroConfig, pathname, pageData.route.type);
	const outFile = getOutFile(astroConfig, outFolder, pathname, pageData.route.type);
	await fs.promises.mkdir(outFolder, { recursive: true });
	await fs.promises.writeFile(outFile, body, 'utf-8');
}
