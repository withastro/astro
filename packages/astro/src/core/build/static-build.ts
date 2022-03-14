import type { OutputChunk, OutputAsset, RollupOutput } from 'rollup';
import type { Plugin as VitePlugin, UserConfig, Manifest as ViteManifest } from 'vite';
import type { AstroConfig, ComponentInstance, ManifestData, Renderer, RouteType } from '../../@types/astro';
import type { AllPagesData } from './types';
import type { LogOptions } from '../logger';
import type { ViteConfigWithSSR } from '../create-vite';
import type { PageBuildData } from './types';
import type { BuildInternals } from '../../core/build/internal.js';
import type { SerializedSSRManifest, SerializedRouteInfo } from '../app/types';

import fs from 'fs';
import npath from 'path';
import { fileURLToPath } from 'url';
import glob from 'fast-glob';
import * as vite from 'vite';
import { debug, error } from '../../core/logger.js';
import { prependForwardSlash, appendForwardSlash } from '../../core/path.js';
import { emptyDir, removeDir, resolveDependency } from '../../core/util.js';
import { createBuildInternals } from '../../core/build/internal.js';
import { rollupPluginAstroBuildCSS } from '../../vite-plugin-build-css/index.js';
import { vitePluginHoistedScripts } from './vite-plugin-hoisted-scripts.js';
import { RouteCache } from '../render/route-cache.js';
import { serializeRouteData } from '../routing/index.js';
import { render } from '../render/core.js';
import { createLinkStylesheetElementSet, createModuleScriptElementWithSrcSet } from '../render/ssr-element.js';

export interface StaticBuildOptions {
	allPages: AllPagesData;
	astroConfig: AstroConfig;
	logging: LogOptions;
	manifest: ManifestData;
	origin: string;
	pageNames: string[];
	routeCache: RouteCache;
	viteConfig: ViteConfigWithSSR;
}

// Render is usually compute, which Node.js can't parallelize well.
// In real world testing, dropping from 10->1 showed a notiable perf
// improvement. In the future, we can revisit a smarter parallel
// system, possibly one that parallelizes if async IO is detected.
const MAX_CONCURRENT_RENDERS = 1;

const STATUS_CODE_PAGES = new Set(['/404', '/500']);

function addPageName(pathname: string, opts: StaticBuildOptions): void {
	opts.pageNames.push(pathname.replace(/\/?$/, '/').replace(/^\//, ''));
}

// Gives back a facadeId that is relative to the root.
// ie, src/pages/index.astro instead of /Users/name..../src/pages/index.astro
function rootRelativeFacadeId(facadeId: string, astroConfig: AstroConfig): string {
	return facadeId.slice(fileURLToPath(astroConfig.projectRoot).length);
}

// Determines of a Rollup chunk is an entrypoint page.
function chunkIsPage(astroConfig: AstroConfig, output: OutputAsset | OutputChunk, internals: BuildInternals) {
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
	return (
		map.get(facadeId) ||
		// Windows the facadeId has forward slashes, no idea why
		map.get(facadeId.replace(/\//g, '\\'))
	);
}

export async function staticBuild(opts: StaticBuildOptions) {
	const { allPages, astroConfig } = opts;

	// Basic options
	const staticMode = !astroConfig.buildOptions.experimentalSsr;

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
		const astroModuleId = prependForwardSlash(component);

		if (pageData.route.type === 'page') {
			const [renderers, mod] = pageData.preload;
			const metadata = mod.$$metadata;

			const topLevelImports = new Set([
				// Any component that gets hydrated
				...metadata.hydratedComponentPaths(),
				// Client-only components
				...metadata.clientOnlyComponentPaths(),
				// Any hydration directive like astro/client/idle.js
				...metadata.hydrationDirectiveSpecifiers(),
				// The client path for each renderer
				...renderers.filter((renderer) => !!renderer.source).map((renderer) => renderer.source!),
			]);

			// Add hoisted scripts
			const hoistedScripts = new Set(metadata.hoistedScriptPaths());
			if (hoistedScripts.size) {
				const moduleId = npath.posix.join(astroModuleId, 'hoisted.js');
				internals.hoistedScriptIdToHoistedMap.set(moduleId, hoistedScripts);
				topLevelImports.add(moduleId);
			}

			for (const specifier of topLevelImports) {
				jsInput.add(specifier);
			}
		}

		pageInput.add(astroModuleId);
		facadeIdToPageDataMap.set(fileURLToPath(astroModuleURL), pageData);
	}

	// Empty out the dist folder, if needed. Vite has a config for doing this
	// but because we are running 2 vite builds in parallel, that would cause a race
	// condition, so we are doing it ourselves
	emptyDir(astroConfig.dist, new Set('.git'));

	// Build your project (SSR application code, assets, client JS, etc.)
	const ssrResult = (await ssrBuild(opts, internals, pageInput)) as RollupOutput;
	await clientBuild(opts, internals, jsInput);

	// SSG mode, generate pages.
	if (staticMode) {
		// Generate each of the pages.
		await generatePages(ssrResult, opts, internals, facadeIdToPageDataMap);
		await cleanSsrOutput(opts);
	} else {
		await generateManifest(ssrResult, opts, internals);
		await ssrMoveAssets(opts);
	}
}

async function ssrBuild(opts: StaticBuildOptions, internals: BuildInternals, input: Set<string>) {
	const { astroConfig, viteConfig } = opts;
	const ssr = astroConfig.buildOptions.experimentalSsr;
	const out = ssr ? getServerRoot(astroConfig) : getOutRoot(astroConfig);

	return await vite.build({
		logLevel: 'warn',
		mode: 'production',
		build: {
			...viteConfig.build,
			emptyOutDir: false,
			manifest: ssr,
			outDir: fileURLToPath(out),
			ssr: true,
			rollupOptions: {
				input: Array.from(input),
				output: {
					format: 'esm',
					entryFileNames: '[name].[hash].mjs',
					chunkFileNames: 'chunks/[name].[hash].mjs',
					assetFileNames: 'assets/[name].[hash][extname]',
				},
			},
			// must match an esbuild target
			target: 'esnext',
			// improve build performance
			minify: false,
			polyfillModulePreload: false,
			reportCompressedSize: false,
		},
		plugins: [
			vitePluginNewBuild(input, internals, 'mjs'),
			rollupPluginAstroBuildCSS({
				internals,
			}),
			...(viteConfig.plugins || []),
		],
		publicDir: ssr ? false : viteConfig.publicDir,
		root: viteConfig.root,
		envPrefix: 'PUBLIC_',
		server: viteConfig.server,
		base: astroConfig.buildOptions.site ? new URL(astroConfig.buildOptions.site).pathname : '/',
		ssr: viteConfig.ssr,
	} as ViteConfigWithSSR);
}

async function clientBuild(opts: StaticBuildOptions, internals: BuildInternals, input: Set<string>) {
	const { astroConfig, viteConfig } = opts;

	// Nothing to do if there is no client-side JS.
	if (!input.size) {
		return null;
	}

	const out = astroConfig.buildOptions.experimentalSsr ? getClientRoot(astroConfig) : getOutRoot(astroConfig);
	return await vite.build({
		logLevel: 'warn',
		mode: 'production',
		build: {
			emptyOutDir: false,
			minify: 'esbuild',
			outDir: fileURLToPath(out),
			rollupOptions: {
				input: Array.from(input),
				output: {
					format: 'esm',
					entryFileNames: '[name].[hash].js',
					chunkFileNames: 'chunks/[name].[hash].js',
					assetFileNames: 'assets/[name].[hash][extname]',
				},
				preserveEntrySignatures: 'exports-only',
			},
			target: 'esnext', // must match an esbuild target
		},
		plugins: [
			vitePluginNewBuild(input, internals, 'js'),
			vitePluginHoistedScripts(astroConfig, internals),
			rollupPluginAstroBuildCSS({
				internals,
			}),
			...(viteConfig.plugins || []),
		],
		publicDir: viteConfig.publicDir,
		root: viteConfig.root,
		envPrefix: 'PUBLIC_',
		server: viteConfig.server,
		base: appendForwardSlash(astroConfig.buildOptions.site ? new URL(astroConfig.buildOptions.site).pathname : '/'),
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
			const mod = await import(resolveDependency(r.serverEntry, opts.astroConfig));
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
	debug('build', 'Finish build. Begin generating.');

	// Get renderers to be shared for each page generation.
	const renderers = await collectRenderers(opts);

	for (let output of result.output) {
		if (chunkIsPage(opts.astroConfig, output, internals)) {
			await generatePage(output as OutputChunk, opts, internals, facadeIdToPageDataMap, renderers);
		}
	}
}

async function generatePage(output: OutputChunk, opts: StaticBuildOptions, internals: BuildInternals, facadeIdToPageDataMap: Map<string, PageBuildData>, renderers: Renderer[]) {
	const { astroConfig } = opts;

	let url = new URL('./' + output.fileName, getOutRoot(astroConfig));
	const facadeId: string = output.facadeModuleId as string;
	let pageData = getByFacadeId<PageBuildData>(facadeId, facadeIdToPageDataMap);

	if (!pageData) {
		throw new Error(`Unable to find a PageBuildData for the Astro page: ${facadeId}. There are the PageBuildDatas we have ${Array.from(facadeIdToPageDataMap.keys()).join(', ')}`);
	}

	const linkIds = getByFacadeId<string[]>(facadeId, internals.facadeIdToAssetsMap) || [];
	const hoistedId = getByFacadeId<string>(facadeId, internals.facadeIdToHoistedEntryMap) || null;

	let compiledModule = await import(url.toString());

	const generationOptions: Readonly<GeneratePathOptions> = {
		pageData,
		internals,
		linkIds,
		hoistedId,
		mod: compiledModule,
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
	mod: ComponentInstance;
	renderers: Renderer[];
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

	try {
		const html = await render({
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
					throw new Error(`Cannot find the built path for ${specifier}`);
				}
				const relPath = npath.posix.relative(pathname, '/' + hashedFilePath);
				const fullyRelativePath = relPath[0] === '.' ? relPath : './' + relPath;
				return fullyRelativePath;
			},
			route: pageData.route,
			routeCache,
			site: astroConfig.buildOptions.site,
		});

		const outFolder = getOutFolder(astroConfig, pathname, pageData.route.type);
		const outFile = getOutFile(astroConfig, outFolder, pathname, pageData.route.type);
		await fs.promises.mkdir(outFolder, { recursive: true });
		await fs.promises.writeFile(outFile, html, 'utf-8');
	} catch (err) {
		error(opts.logging, 'build', `Error rendering:`, err);
	}
}

async function generateManifest(result: RollupOutput, opts: StaticBuildOptions, internals: BuildInternals) {
	const { astroConfig, manifest } = opts;
	const manifestFile = new URL('./manifest.json', getServerRoot(astroConfig));

	const inputManifestJSON = await fs.promises.readFile(manifestFile, 'utf-8');
	const data: ViteManifest = JSON.parse(inputManifestJSON);

	const rootRelativeIdToChunkMap = new Map<string, OutputChunk>();
	for (const output of result.output) {
		if (chunkIsPage(astroConfig, output, internals)) {
			const chunk = output as OutputChunk;
			if (chunk.facadeModuleId) {
				const id = rootRelativeFacadeId(chunk.facadeModuleId, astroConfig);
				rootRelativeIdToChunkMap.set(id, chunk);
			}
		}
	}

	const routes: SerializedRouteInfo[] = [];

	for (const routeData of manifest.routes) {
		const componentPath = routeData.component;
		const entry = data[componentPath];

		if (!rootRelativeIdToChunkMap.has(componentPath)) {
			throw new Error('Unable to find chunk for ' + componentPath);
		}

		const chunk = rootRelativeIdToChunkMap.get(componentPath)!;
		const facadeId = chunk.facadeModuleId!;
		const links = getByFacadeId<string[]>(facadeId, internals.facadeIdToAssetsMap) || [];
		const hoistedScript = getByFacadeId<string>(facadeId, internals.facadeIdToHoistedEntryMap);
		const scripts = hoistedScript ? [hoistedScript] : [];

		routes.push({
			file: entry?.file,
			links,
			scripts,
			routeData: serializeRouteData(routeData),
		});
	}

	const ssrManifest: SerializedSSRManifest = {
		routes,
		site: astroConfig.buildOptions.site,
		markdown: {
			render: astroConfig.markdownOptions.render,
		},
		renderers: astroConfig.renderers,
		entryModules: Object.fromEntries(internals.entrySpecifierToBundleMap.entries()),
	};

	const outputManifestJSON = JSON.stringify(ssrManifest, null, '  ');
	await fs.promises.writeFile(manifestFile, outputManifestJSON, 'utf-8');
}

function getOutRoot(astroConfig: AstroConfig): URL {
	return new URL('./', astroConfig.dist);
}

function getServerRoot(astroConfig: AstroConfig): URL {
	const rootFolder = getOutRoot(astroConfig);
	const serverFolder = new URL('./server/', rootFolder);
	return serverFolder;
}

function getClientRoot(astroConfig: AstroConfig): URL {
	const rootFolder = getOutRoot(astroConfig);
	const serverFolder = new URL('./client/', rootFolder);
	return serverFolder;
}

function getOutFolder(astroConfig: AstroConfig, pathname: string, routeType: RouteType): URL {
	const outRoot = getOutRoot(astroConfig);

	// This is the root folder to write to.
	switch (routeType) {
		case 'endpoint':
			return new URL('.' + appendForwardSlash(npath.dirname(pathname)), outRoot);
		case 'page':
			switch (astroConfig.buildOptions.pageUrlFormat) {
				case 'directory': {
					if (STATUS_CODE_PAGES.has(pathname)) {
						return new URL('.' + appendForwardSlash(npath.dirname(pathname)), outRoot);
					}
					return new URL('.' + appendForwardSlash(pathname), outRoot);
				}
				case 'file': {
					return new URL('.' + appendForwardSlash(npath.dirname(pathname)), outRoot);
				}
			}
	}
}

function getOutFile(astroConfig: AstroConfig, outFolder: URL, pathname: string, routeType: RouteType): URL {
	switch (routeType) {
		case 'endpoint':
			return new URL(npath.basename(pathname), outFolder);
		case 'page':
			switch (astroConfig.buildOptions.pageUrlFormat) {
				case 'directory': {
					if (STATUS_CODE_PAGES.has(pathname)) {
						const baseName = npath.basename(pathname);
						return new URL('./' + (baseName || 'index') + '.html', outFolder);
					}
					return new URL('./index.html', outFolder);
				}
				case 'file': {
					const baseName = npath.basename(pathname);
					return new URL('./' + (baseName || 'index') + '.html', outFolder);
				}
			}
	}
}

async function cleanSsrOutput(opts: StaticBuildOptions) {
	// The SSR output is all .mjs files, the client output is not.
	const files = await glob('**/*.mjs', {
		cwd: fileURLToPath(opts.astroConfig.dist),
	});
	await Promise.all(
		files.map(async (filename) => {
			const url = new URL(filename, opts.astroConfig.dist);
			await fs.promises.rm(url);
		})
	);
}

async function ssrMoveAssets(opts: StaticBuildOptions) {
	const { astroConfig } = opts;
	const serverRoot = getServerRoot(astroConfig);
	const clientRoot = getClientRoot(astroConfig);
	const serverAssets = new URL('./assets/', serverRoot);
	const clientAssets = new URL('./assets/', clientRoot);
	const files = await glob('assets/**/*', {
		cwd: fileURLToPath(serverRoot),
	});

	// Make the directory
	await fs.promises.mkdir(clientAssets, { recursive: true });

	await Promise.all(
		files.map(async (filename) => {
			const currentUrl = new URL(filename, serverRoot);
			const clientUrl = new URL(filename, clientRoot);
			return fs.promises.rename(currentUrl, clientUrl);
		})
	);

	await removeDir(serverAssets);
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
