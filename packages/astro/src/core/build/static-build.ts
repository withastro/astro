import type { OutputChunk, PreRenderedChunk, RollupOutput } from 'rollup';
import type { Plugin as VitePlugin, UserConfig } from '../vite';
import type { AstroConfig, RouteCache, SSRElement } from '../../@types/astro';
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

export interface StaticBuildOptions {
	allPages: AllPagesData;
	astroConfig: AstroConfig;
	logging: LogOptions;
	origin: string;
	routeCache: RouteCache;
	viteConfig: ViteConfigWithSSR;
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

	for (const [component, pageData] of Object.entries(allPages)) {
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

		for (const specifier of topLevelImports) {
			jsInput.add(specifier);
		}

		let astroModuleId = new URL('./' + component, astroConfig.projectRoot).pathname;
		pageInput.add(astroModuleId);
		facadeIdToPageDataMap.set(astroModuleId, pageData);
	}

	// Build internals needed by the CSS plugin
	const internals = createBuildInternals();

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
			emptyOutDir: true,
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

async function generatePages(result: RollupOutput, opts: StaticBuildOptions, internals: BuildInternals, facadeIdToPageDataMap: Map<string, PageBuildData>) {
	debug(opts.logging, 'generate', 'End build step, now generating');
	const generationPromises = [];
	for (let output of result.output) {
		if (output.type === 'chunk' && output.facadeModuleId && output.facadeModuleId.endsWith('.astro')) {
			generationPromises.push(generatePage(output, opts, internals, facadeIdToPageDataMap));
		}
	}
	await Promise.all(generationPromises);
}

async function generatePage(output: OutputChunk, opts: StaticBuildOptions, internals: BuildInternals, facadeIdToPageDataMap: Map<string, PageBuildData>) {
	const { astroConfig } = opts;

	let url = new URL('./' + output.fileName, astroConfig.dist);
	const facadeId: string = output.facadeModuleId as string;
	let pageData =
		facadeIdToPageDataMap.get(facadeId) ||
		// Check with a leading `/` because on Windows it doesn't have one.
		facadeIdToPageDataMap.get('/' + facadeId);

	if (!pageData) {
		throw new Error(`Unable to find a PageBuildData for the Astro page: ${facadeId}. There are the PageBuilDatas we have ${Array.from(facadeIdToPageDataMap.keys()).join(', ')}`);
	}

	let linkIds = internals.facadeIdToAssetsMap.get(facadeId) || [];
	let compiledModule = await import(url.toString());
	let Component = compiledModule.default;

	const generationOptions: Readonly<GeneratePathOptions> = {
		pageData,
		internals,
		linkIds,
		Component,
	};

	const renderPromises = pageData.paths.map((path) => {
		return generatePath(path, opts, generationOptions);
	});
	return await Promise.all(renderPromises);
}

interface GeneratePathOptions {
	pageData: PageBuildData;
	internals: BuildInternals;
	linkIds: string[];
	Component: AstroComponentFactory;
}

async function generatePath(pathname: string, opts: StaticBuildOptions, gopts: GeneratePathOptions) {
	const { astroConfig, logging, origin, routeCache } = opts;
	const { Component, internals, linkIds, pageData } = gopts;

	const [renderers, mod] = pageData.preload;

	try {
		const [params, pageProps] = await getParamsAndProps({
			route: pageData.route,
			routeCache,
			logging,
			pathname,
			mod,
		});

		debug(logging, 'generate', `Generating: ${pathname}`);

		const result = createResult({ astroConfig, origin, params, pathname, renderers });
		result.links = new Set<SSRElement>(
			linkIds.map((href) => ({
				props: {
					rel: 'stylesheet',
					href,
				},
				children: '',
			}))
		);
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
