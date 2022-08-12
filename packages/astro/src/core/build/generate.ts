import fs from 'fs';
import * as colors from 'kleur/colors';
import { bgGreen, black, cyan, dim, green, magenta } from 'kleur/colors';
import npath from 'path';
import type { OutputAsset, OutputChunk } from 'rollup';
import { fileURLToPath } from 'url';
import type {
	AstroConfig,
	ComponentInstance,
	EndpointHandler,
	SSRLoadedRenderer,
} from '../../@types/astro';
import type { BuildInternals } from '../../core/build/internal.js';
import {
	joinPaths,
	prependForwardSlash,
	removeLeadingForwardSlash,
	removeTrailingForwardSlash,
} from '../../core/path.js';
import type { RenderOptions } from '../../core/render/core';
import { BEFORE_HYDRATION_SCRIPT_ID, PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import { call as callEndpoint } from '../endpoint/index.js';
import { debug, info } from '../logger/core.js';
import { render } from '../render/core.js';
import { callGetStaticPaths } from '../render/route-cache.js';
import { createLinkStylesheetElementSet, createModuleScriptsSet } from '../render/ssr-element.js';
import { createRequest } from '../request.js';
import { matchRoute } from '../routing/match.js';
import { getOutputFilename } from '../util.js';
import { getOutFile, getOutFolder } from './common.js';
import { eachPageData, getPageDataByComponent } from './internal.js';
import type { PageBuildData, SingleFileBuiltModule, StaticBuildOptions } from './types';
import { getTimeStat } from './util.js';

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

function shouldSkipDraft(pageModule: ComponentInstance, astroConfig: AstroConfig): boolean {
	return (
		// Drafts are disabled
		!astroConfig.markdown.drafts &&
		// This is a draft post
		'frontmatter' in pageModule &&
		(pageModule as any).frontmatter?.draft === true
	);
}

// Gives back a facadeId that is relative to the root.
// ie, src/pages/index.astro instead of /Users/name..../src/pages/index.astro
export function rootRelativeFacadeId(facadeId: string, astroConfig: AstroConfig): string {
	return facadeId.slice(fileURLToPath(astroConfig.root).length);
}

// Determines of a Rollup chunk is an entrypoint page.
export function chunkIsPage(
	astroConfig: AstroConfig,
	output: OutputAsset | OutputChunk,
	internals: BuildInternals
) {
	if (output.type !== 'chunk') {
		return false;
	}
	const chunk = output as OutputChunk;
	if (chunk.facadeModuleId) {
		const facadeToEntryId = prependForwardSlash(
			rootRelativeFacadeId(chunk.facadeModuleId, astroConfig)
		);
		return internals.entrySpecifierToBundleMap.has(facadeToEntryId);
	}
	return false;
}

export async function generatePages(opts: StaticBuildOptions, internals: BuildInternals) {
	const timer = performance.now();
	info(opts.logging, null, `\n${bgGreen(black(' generating static routes '))}`);

	const ssr = opts.astroConfig.output === 'server';
	const serverEntry = opts.buildConfig.serverEntry;
	const outFolder = ssr ? opts.buildConfig.server : opts.astroConfig.outDir;
	const ssrEntryURL = new URL('./' + serverEntry + `?time=${Date.now()}`, outFolder);
	const ssrEntry = await import(ssrEntryURL.toString());
	const builtPaths = new Set<string>();

	for (const pageData of eachPageData(internals)) {
		await generatePage(opts, internals, pageData, ssrEntry, builtPaths);
	}
	info(opts.logging, null, dim(`Completed in ${getTimeStat(timer, performance.now())}.\n`));
}

async function generatePage(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	pageData: PageBuildData,
	ssrEntry: SingleFileBuiltModule,
	builtPaths: Set<string>
) {
	let timeStart = performance.now();
	const renderers = ssrEntry.renderers;

	const pageInfo = getPageDataByComponent(internals, pageData.route.component);
	const linkIds: string[] = Array.from(pageInfo?.css ?? []);
	const scripts = pageInfo?.hoistedScript ?? null;

	const pageModule = ssrEntry.pageMap.get(pageData.component);

	if (!pageModule) {
		throw new Error(
			`Unable to find the module for ${pageData.component}. This is unexpected and likely a bug in Astro, please report.`
		);
	}

	if (shouldSkipDraft(pageModule, opts.astroConfig)) {
		info(opts.logging, null, `${magenta('⚠️')}  Skipping draft ${pageData.route.component}`);
		return;
	}

	const generationOptions: Readonly<GeneratePathOptions> = {
		pageData,
		internals,
		linkIds,
		scripts,
		mod: pageModule,
		renderers,
	};

	const icon = pageData.route.type === 'page' ? green('▶') : magenta('λ');
	info(opts.logging, null, `${icon} ${pageData.route.component}`);

	// Get paths for the route, calling getStaticPaths if needed.
	const paths = await getPathsForRoute(pageData, pageModule, opts, builtPaths);

	for (let i = 0; i < paths.length; i++) {
		const path = paths[i];
		await generatePath(path, opts, generationOptions);
		const timeEnd = performance.now();
		const timeChange = getTimeStat(timeStart, timeEnd);
		const timeIncrease = `(+${timeChange})`;
		const filePath = getOutputFilename(opts.astroConfig, path, pageData.route.type);
		const lineIcon = i === paths.length - 1 ? '└─' : '├─';
		info(opts.logging, null, `  ${cyan(lineIcon)} ${dim(filePath)} ${dim(timeIncrease)}`);
	}
}

async function getPathsForRoute(
	pageData: PageBuildData,
	mod: ComponentInstance,
	opts: StaticBuildOptions,
	builtPaths: Set<string>
): Promise<Array<string>> {
	let paths: Array<string> = [];
	if (pageData.route.pathname) {
		paths.push(pageData.route.pathname);
		builtPaths.add(pageData.route.pathname);
	} else {
		const route = pageData.route;
		const result = await callGetStaticPaths({
			mod,
			route: pageData.route,
			isValidate: false,
			logging: opts.logging,
			ssr: opts.astroConfig.output === 'server',
		})
			.then((_result) => {
				const label = _result.staticPaths.length === 1 ? 'page' : 'pages';
				debug(
					'build',
					`├── ${colors.bold(colors.green('✔'))} ${route.component} → ${colors.magenta(
						`[${_result.staticPaths.length} ${label}]`
					)}`
				);
				return _result;
			})
			.catch((err) => {
				debug('build', `├── ${colors.bold(colors.red('✗'))} ${route.component}`);
				throw err;
			});

		// Save the route cache so it doesn't get called again
		opts.routeCache.set(route, result);

		paths = result.staticPaths
			.map((staticPath) => staticPath.params && route.generate(staticPath.params))
			.filter((staticPath) => {
				// Remove empty or undefined paths
				if (!staticPath) {
					return false;
				}

				// The path hasn't been built yet, include it
				if (!builtPaths.has(removeTrailingForwardSlash(staticPath))) {
					return true;
				}

				// The path was already built once. Check the manifest to see if
				// this route takes priority for the final URL.
				// NOTE: The same URL may match multiple routes in the manifest.
				// Routing priority needs to be verified here for any duplicate
				// paths to ensure routing priority rules are enforced in the final build.
				const matchedRoute = matchRoute(staticPath, opts.manifest);
				return matchedRoute === route;
			});

		// Add each path to the builtPaths set, to avoid building it again later.
		for (const staticPath of paths) {
			builtPaths.add(removeTrailingForwardSlash(staticPath));
		}
	}

	return paths;
}

interface GeneratePathOptions {
	pageData: PageBuildData;
	internals: BuildInternals;
	linkIds: string[];
	scripts: { type: 'inline' | 'external'; value: string } | null;
	mod: ComponentInstance;
	renderers: SSRLoadedRenderer[];
}

function addPageName(pathname: string, opts: StaticBuildOptions): void {
	opts.pageNames.push(pathname.replace(/^\//, ''));
}

async function generatePath(
	pathname: string,
	opts: StaticBuildOptions,
	gopts: GeneratePathOptions
) {
	const { astroConfig, logging, origin, routeCache } = opts;
	const { mod, internals, linkIds, scripts: hoistedScripts, pageData, renderers } = gopts;

	// This adds the page name to the array so it can be shown as part of stats.
	if (pageData.route.type === 'page') {
		addPageName(pathname, opts);
	}

	debug('build', `Generating: ${pathname}`);

	// If a base path was provided, append it to the site URL. This ensures that
	// all injected scripts and links are referenced relative to the site and subpath.
	const site =
		astroConfig.base !== '/'
			? joinPaths(astroConfig.site?.toString() || 'http://localhost/', astroConfig.base)
			: astroConfig.site;
	const links = createLinkStylesheetElementSet(linkIds.reverse(), site);
	const scripts = createModuleScriptsSet(hoistedScripts ? [hoistedScripts] : [], site);

	if (astroConfig._ctx.scripts.some((script) => script.stage === 'page')) {
		const hashedFilePath = internals.entrySpecifierToBundleMap.get(PAGE_SCRIPT_ID);
		if (typeof hashedFilePath !== 'string') {
			throw new Error(`Cannot find the built path for ${PAGE_SCRIPT_ID}`);
		}
		const src = prependForwardSlash(npath.posix.join(astroConfig.base, hashedFilePath));
		scripts.add({
			props: { type: 'module', src },
			children: '',
		});
	}

	// Add all injected scripts to the page.
	for (const script of astroConfig._ctx.scripts) {
		if (script.stage === 'head-inline') {
			scripts.add({
				props: {},
				children: script.content,
			});
		}
	}

	const ssr = opts.astroConfig.output === 'server';
	const url = new URL(opts.astroConfig.base + removeLeadingForwardSlash(pathname), origin);
	const options: RenderOptions = {
		adapterName: undefined,
		links,
		logging,
		markdown: {
			...astroConfig.markdown,
			isAstroFlavoredMd: astroConfig.legacy.astroFlavoredMarkdown,
		},
		mod,
		mode: opts.mode,
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
			return prependForwardSlash(npath.posix.join(astroConfig.base, hashedFilePath));
		},
		request: createRequest({ url, headers: new Headers(), logging, ssr }),
		route: pageData.route,
		routeCache,
		site: astroConfig.site
			? new URL(astroConfig.base, astroConfig.site).toString()
			: astroConfig.site,
		ssr,
		streaming: true,
	};

	let body: string;
	if (pageData.route.type === 'endpoint') {
		const result = await callEndpoint(mod as unknown as EndpointHandler, options);

		if (result.type === 'response') {
			throw new Error(`Returning a Response from an endpoint is not supported in SSG mode.`);
		}
		body = result.body;
	} else {
		const response = await render(options);

		// If there's a redirect or something, just do nothing.
		if (response.status !== 200 || !response.body) {
			return;
		}

		body = await response.text();
	}

	const outFolder = getOutFolder(astroConfig, pathname, pageData.route.type);
	const outFile = getOutFile(astroConfig, outFolder, pathname, pageData.route.type);
	pageData.route.distURL = outFile;
	await fs.promises.mkdir(outFolder, { recursive: true });
	await fs.promises.writeFile(outFile, body, 'utf-8');
}
