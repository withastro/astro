import type { OutputChunk, OutputAsset, PreRenderedChunk, RollupOutput } from 'rollup';
import type { Plugin as VitePlugin, UserConfig } from '../vite';
import type { AstroConfig, Renderer, RouteCache, SSRElement } from '../../@types/astro';
import type { AllPagesData } from './types';
import type { LogOptions } from '../logger';
import type { ViteConfigWithSSR } from '../create-vite';
import type { PageBuildData } from './types';
import type { BuildInternals } from '../../core/build/internal.js';
import type { AstroComponentFactory } from '../../runtime/server';

import fs from 'fs';
import npath from 'path';
import { fileURLToPath } from 'url';
import glob from 'fast-glob';
import vite from '../vite.js';
import { debug, error } from '../../core/logger.js';
import { createBuildInternals } from '../../core/build/internal.js';
import { rollupPluginAstroBuildCSS } from '../../vite-plugin-build-css/index.js';
import { getParamsAndProps } from '../ssr/index.js';
import { createResult } from '../ssr/result.js';
import { renderPage } from '../../runtime/server/index.js';
import { prepareOutDir } from './fs.js';
import { vitePluginHoistedScripts } from './vite-plugin-hoisted-scripts.js';

export interface StaticBuildOptions {
	allPages: AllPagesData;
	astroConfig: AstroConfig;
	logging: LogOptions;
	origin: string;
	pageNames: string[];
	routeCache: RouteCache;
	viteConfig: ViteConfigWithSSR;
}

const MAX_CONCURRENT_RENDERS = 10;

function addPageName(pathname: string, opts: StaticBuildOptions): void {
	const pathrepl = opts.astroConfig.buildOptions.pageUrlFormat === 'directory' ? '/index.html' : pathname === '/' ? 'index.html' : '.html';
	opts.pageNames.push(pathname.replace(/\/?$/, pathrepl).replace(/^\//, ''));
}

// Determines of a Rollup chunk is an entrypoint page.
function chunkIsPage(output: OutputAsset | OutputChunk, internals: BuildInternals) {
	if (output.type !== 'chunk') {
		return false;
	}
	const chunk = output as OutputChunk;
	return chunk.facadeModuleId && (internals.entrySpecifierToBundleMap.has(chunk.facadeModuleId) || internals.entrySpecifierToBundleMap.has('/' + chunk.facadeModuleId));
}

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

function getByFacadeId<T>(facadeId: string, map: Map<string, T>): T | undefined {
	return map.get(facadeId) ||
		// Check with a leading `/` because on Windows it doesn't have one.
		map.get('/' + facadeId);
}

export async function staticBuild(opts: StaticBuildOptions) {
	const { allPages, astroConfig } = opts;

	// The pages to be built for rendering purposes.
	const pageInput = new Set<string>();

	// The JavaScript entrypoints.
	const jsInput = new Set<string>();

	// A map of each page .astro file, to the PageBuildData which contains information
	// about that page, such as its paths.
	const facadeIdToPageDataMap = new Map<string, PageBuildData>();

	// Collects polyfills and passes them as top-level inputs
	const polyfills = getRenderers(opts).flatMap((renderer) => {
		return (renderer.polyfills || []).concat(renderer.hydrationPolyfills || []);
	});
	for (const polyfill of polyfills) {
		jsInput.add(polyfill);
	}

	// Build internals needed by the CSS plugin
	const internals = createBuildInternals();

	for (const [component, pageData] of Object.entries(allPages)) {
		const astroModuleURL = new URL('./' + component, astroConfig.projectRoot);
		const astroModuleId = astroModuleURL.pathname;
		const [renderers, mod] = pageData.preload;
		const metadata = mod.$$metadata;

		const topLevelImports = new Set([
			// Any component that gets hydrated
			...metadata.hydratedComponentPaths(),
			// Any hydration directive like astro/client/idle.js
			...metadata.hydrationDirectiveSpecifiers(),
			// The client path for each renderer
			...renderers.filter((renderer) => !!renderer.source).map((renderer) => renderer.source!),
		]);

		// Add hoisted scripts
		const hoistedScripts = new Set(metadata.hoistedScriptPaths());
		if(hoistedScripts.size) {
			const moduleId = new URL('./hoisted.js', astroModuleURL + '/').pathname;
			internals.hoistedScriptIdToHoistedMap.set(moduleId, hoistedScripts);
			topLevelImports.add(moduleId);
		}

		for (const specifier of topLevelImports) {
			jsInput.add(specifier);
		}

		
		pageInput.add(astroModuleId);
		facadeIdToPageDataMap.set(astroModuleId, pageData);
	}

	// Empty out the dist folder, if needed. Vite has a config for doing this
	// but because we are running 2 vite builds in parallel, that would cause a race
	// condition, so we are doing it ourselves
	prepareOutDir(astroConfig);

	// Run the SSR build and client build in parallel
	const [ssrResult] = (await Promise.all([ssrBuild(opts, internals, pageInput), clientBuild(opts, internals, jsInput)])) as RollupOutput[];

	// Generate each of the pages.
	await generatePages(ssrResult, opts, internals, facadeIdToPageDataMap);
	await cleanSsrOutput(opts);
}

async function ssrBuild(opts: StaticBuildOptions, internals: BuildInternals, input: Set<string>) {
	const { astroConfig, viteConfig } = opts;

	return await vite.build({
		logLevel: 'error',
		mode: 'production',
		build: {
			emptyOutDir: false,
			minify: false,
			outDir: fileURLToPath(astroConfig.dist),
			ssr: true,
			rollupOptions: {
				input: Array.from(input),
				output: {
					format: 'esm',
				},
			},
			target: 'es2020', // must match an esbuild target
		},
		plugins: [
			vitePluginNewBuild(input, internals, 'mjs'),
			rollupPluginAstroBuildCSS({
				internals,
			}),
			...(viteConfig.plugins || []),
		],
		publicDir: viteConfig.publicDir,
		root: viteConfig.root,
		envPrefix: 'PUBLIC_',
		server: viteConfig.server,
		base: astroConfig.buildOptions.site ? new URL(astroConfig.buildOptions.site).pathname : '/',
	});
}

async function clientBuild(opts: StaticBuildOptions, internals: BuildInternals, input: Set<string>) {
	const { astroConfig, viteConfig } = opts;

	// Nothing to do if there is no client-side JS.
	if (!input.size) {
		return null;
	}

	return await vite.build({
		logLevel: 'error',
		mode: 'production',
		build: {
			emptyOutDir: false,
			minify: 'esbuild',
			outDir: fileURLToPath(astroConfig.dist),
			rollupOptions: {
				input: Array.from(input),
				output: {
					format: 'esm',
				},
				preserveEntrySignatures: 'exports-only',
			},
			target: 'es2020', // must match an esbuild target
		},
		plugins: [
			vitePluginNewBuild(input, internals, 'js'),
			vitePluginHoistedScripts(internals),
			rollupPluginAstroBuildCSS({
				internals,
			}),
			...(viteConfig.plugins || []),
		],
		publicDir: viteConfig.publicDir,
		root: viteConfig.root,
		envPrefix: 'PUBLIC_',
		server: viteConfig.server,
		base: astroConfig.buildOptions.site ? new URL(astroConfig.buildOptions.site).pathname : '/',
	});
}

function getRenderers(opts: StaticBuildOptions) {
	// All of the PageDatas have the same renderers, so just grab one.
	const pageData = Object.values(opts.allPages)[0];
	// These renderers have been loaded through Vite. To generate pages
	// we need the ESM loaded version. This creates that.
	const viteLoadedRenderers = pageData.preload[0];

	return viteLoadedRenderers;
}

async function collectRenderers(opts: StaticBuildOptions): Promise<Renderer[]> {
	const viteLoadedRenderers = getRenderers(opts);

	const renderers = await Promise.all(
		viteLoadedRenderers.map(async (r) => {
			const mod = await import(r.serverEntry);
			return Object.create(r, {
				ssr: {
					value: mod.default,
				},
			}) as Renderer;
		})
	);

	return renderers;
}

async function generatePages(result: RollupOutput, opts: StaticBuildOptions, internals: BuildInternals, facadeIdToPageDataMap: Map<string, PageBuildData>) {
	debug(opts.logging, 'generate', 'End build step, now generating');

	// Get renderers to be shared for each page generation.
	const renderers = await collectRenderers(opts);

	const generationPromises = [];
	for (let output of result.output) {
		if (chunkIsPage(output, internals)) {
			generationPromises.push(generatePage(output as OutputChunk, opts, internals, facadeIdToPageDataMap, renderers));
		}
	}
	await Promise.all(generationPromises);
}

async function generatePage(output: OutputChunk, opts: StaticBuildOptions, internals: BuildInternals, facadeIdToPageDataMap: Map<string, PageBuildData>, renderers: Renderer[]) {
	const { astroConfig } = opts;

	let url = new URL('./' + output.fileName, astroConfig.dist);
	const facadeId: string = output.facadeModuleId as string;
	let pageData = getByFacadeId<PageBuildData>(facadeId, facadeIdToPageDataMap);

	if (!pageData) {
		throw new Error(`Unable to find a PageBuildData for the Astro page: ${facadeId}. There are the PageBuilDatas we have ${Array.from(facadeIdToPageDataMap.keys()).join(', ')}`);
	}

	const linkIds = getByFacadeId<string[]>(facadeId, internals.facadeIdToAssetsMap) || [];
	const hoistedId = getByFacadeId<string>(facadeId, internals.facadeIdToHoistedEntryMap) || null;

	let compiledModule = await import(url.toString());
	let Component = compiledModule.default;

	const generationOptions: Readonly<GeneratePathOptions> = {
		pageData,
		internals,
		linkIds,
		hoistedId,
		Component,
		renderers,
	};

	const renderPromises = [];
	// Throttle the paths to avoid overloading the CPU with too many tasks.
	for (const paths of throttle(MAX_CONCURRENT_RENDERS, pageData.paths)) {
		for (const path of paths) {
			renderPromises.push(generatePath(path, opts, generationOptions));
		}
		// This blocks generating more paths until these 10 complete.
		await Promise.all(renderPromises);
		// This empties the array without allocating a new one.
		renderPromises.length = 0;
	}
}

interface GeneratePathOptions {
	pageData: PageBuildData;
	internals: BuildInternals;
	linkIds: string[];
	hoistedId: string | null;
	Component: AstroComponentFactory;
	renderers: Renderer[];
}

async function generatePath(pathname: string, opts: StaticBuildOptions, gopts: GeneratePathOptions) {
	const { astroConfig, logging, origin, routeCache } = opts;
	const { Component, internals, linkIds, hoistedId, pageData, renderers } = gopts;

	// This adds the page name to the array so it can be shown as part of stats.
	addPageName(pathname, opts);

	const [, mod] = pageData.preload;

	try {
		const [params, pageProps] = await getParamsAndProps({
			route: pageData.route,
			routeCache,
			logging,
			pathname,
			mod,
			// Do not validate as validation already occurred for static routes
			// and validation is relatively expensive.
			validate: false,
		});

		debug(logging, 'generate', `Generating: ${pathname}`);

		const rootpath = new URL(astroConfig.buildOptions.site || 'http://localhost/').pathname;
		const links = new Set<SSRElement>(
			linkIds.map((href) => ({
				props: {
					rel: 'stylesheet',
					href: npath.posix.join(rootpath, href),
				},
				children: '',
			}))
		);
		const scripts = hoistedId ? new Set<SSRElement>([{
			props: {
				type: 'module',
				src: npath.posix.join(rootpath, hoistedId),
			},
			children: ''
		}]) : new Set<SSRElement>();
		const result = createResult({ astroConfig, logging, origin, params, pathname, renderers, links, scripts });

		// Override the `resolve` method so that hydrated components are given the
		// hashed filepath to the component.
		result.resolve = async (specifier: string) => {
			const hashedFilePath = internals.entrySpecifierToBundleMap.get(specifier);
			if (typeof hashedFilePath !== 'string') {
				throw new Error(`Cannot find the built path for ${specifier}`);
			}
			const relPath = npath.posix.relative(pathname, '/' + hashedFilePath);
			const fullyRelativePath = relPath[0] === '.' ? relPath : './' + relPath;
			return fullyRelativePath;
		};

		let html = await renderPage(result, Component, pageProps, null);
		const outFolder = new URL('.' + pathname + '/', astroConfig.dist);
		const outFile = new URL('./index.html', outFolder);
		await fs.promises.mkdir(outFolder, { recursive: true });
		await fs.promises.writeFile(outFile, html, 'utf-8');
	} catch (err) {
		error(opts.logging, 'build', `Error rendering:`, err);
	}
}

async function cleanSsrOutput(opts: StaticBuildOptions) {
	// The SSR output is all .mjs files, the client output is not.
	const files = await glob('**/*.mjs', {
		cwd: opts.astroConfig.dist.pathname,
	});
	await Promise.all(
		files.map(async (filename) => {
			const url = new URL(filename, opts.astroConfig.dist);
			await fs.promises.rm(url);
		})
	);
}

export function vitePluginNewBuild(input: Set<string>, internals: BuildInternals, ext: 'js' | 'mjs'): VitePlugin {
	return {
		name: '@astro/rollup-plugin-new-build',

		config(config, options) {
			const extra: Partial<UserConfig> = {};
			const noExternal = [],
				external = [];
			if (options.command === 'build' && config.build?.ssr) {
				noExternal.push('astro');
				external.push('shiki');
			}

			// @ts-ignore
			extra.ssr = {
				external,
				noExternal,
			};
			return extra;
		},

		configResolved(resolvedConfig) {
			// Delete this hook because it causes assets not to be built
			const plugins = resolvedConfig.plugins as VitePlugin[];
			const viteAsset = plugins.find((p) => p.name === 'vite:asset');
			if (viteAsset) {
				delete viteAsset.generateBundle;
			}
		},

		outputOptions(outputOptions) {
			Object.assign(outputOptions, {
				entryFileNames(_chunk: PreRenderedChunk) {
					return 'assets/[name].[hash].' + ext;
				},
				chunkFileNames(_chunk: PreRenderedChunk) {
					return 'assets/[name].[hash].' + ext;
				},
			});
			return outputOptions;
		},

		async generateBundle(_options, bundle) {
			const promises = [];
			const mapping = new Map<string, string>();
			for (const specifier of input) {
				promises.push(
					this.resolve(specifier).then((result) => {
						if (result) {
							mapping.set(result.id, specifier);
						}
					})
				);
			}
			await Promise.all(promises);
			for (const [, chunk] of Object.entries(bundle)) {
				if (chunk.type === 'chunk' && chunk.facadeModuleId && mapping.has(chunk.facadeModuleId)) {
					const specifier = mapping.get(chunk.facadeModuleId)!;
					internals.entrySpecifierToBundleMap.set(specifier, chunk.fileName);
				}
			}
		},
	};
}
