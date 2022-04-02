import type { RollupOutput } from 'rollup';
import type { BuildInternals } from '../../core/build/internal.js';
import type { ViteConfigWithSSR } from '../create-vite';
import type { PageBuildData, StaticBuildOptions } from './types';
import glob from 'fast-glob';
import fs from 'fs';
import { bgGreen, bgMagenta, black, dim } from 'kleur/colors';
import npath from 'path';
import { fileURLToPath } from 'url';
import * as vite from 'vite';
import { createBuildInternals } from '../../core/build/internal.js';
import { info } from '../logger/core.js';
import { appendForwardSlash, prependForwardSlash } from '../../core/path.js';
import { emptyDir, removeDir } from '../../core/util.js';
import { rollupPluginAstroBuildCSS } from '../../vite-plugin-build-css/index.js';
import { vitePluginHoistedScripts } from './vite-plugin-hoisted-scripts.js';
import { vitePluginInternals } from './vite-plugin-internals.js';
import { vitePluginSSR } from './vite-plugin-ssr.js';
import { vitePluginPages } from './vite-plugin-pages.js';
import { generatePages } from './generate.js';
import { trackPageData } from './internal.js';
import { isBuildingToSSR } from '../util.js';
import { runHookBuildSetup } from '../../integrations/index.js';
import { getTimeStat } from './util.js';

export async function staticBuild(opts: StaticBuildOptions) {
	const { allPages, astroConfig } = opts;

	// The pages to be built for rendering purposes.
	const pageInput = new Set<string>();

	// The JavaScript entrypoints.
	const jsInput = new Set<string>();

	// A map of each page .astro file, to the PageBuildData which contains information
	// about that page, such as its paths.
	const facadeIdToPageDataMap = new Map<string, PageBuildData>();

	// Build internals needed by the CSS plugin
	const internals = createBuildInternals();

	const timer: Record<string, number> = {};

	timer.buildStart = performance.now();

	for (const [component, pageData] of Object.entries(allPages)) {
		const astroModuleURL = new URL('./' + component, astroConfig.root);
		const astroModuleId = prependForwardSlash(component);

		// Track the page data in internals
		trackPageData(internals, component, pageData, astroModuleId, astroModuleURL);

		if (pageData.route.type === 'page') {
			const [renderers, mod] = pageData.preload;
			const metadata = mod.$$metadata;

			const topLevelImports = new Set([
				// Any component that gets hydrated
				// 'components/Counter.jsx'
				// { 'components/Counter.jsx': 'counter.hash.js' }
				...metadata.hydratedComponentPaths(),
				// Client-only components
				...metadata.clientOnlyComponentPaths(),
				// Any hydration directive like astro/client/idle.js
				...metadata.hydrationDirectiveSpecifiers(),
				// The client path for each renderer
				...renderers
					.filter((renderer) => !!renderer.clientEntrypoint)
					.map((renderer) => renderer.clientEntrypoint!),
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
	emptyDir(astroConfig.outDir, new Set('.git'));

	timer.clientBuild = performance.now();
	// Run client build first, so the assets can be fed into the SSR rendered version.
	await clientBuild(opts, internals, jsInput);

	// Build your project (SSR application code, assets, client JS, etc.)
	timer.ssr = performance.now();
	info(opts.logging, 'build', 'Building for SSR...');
	const ssrResult = (await ssrBuild(opts, internals, pageInput)) as RollupOutput;
	info(opts.logging, 'build', dim(`Completed in ${getTimeStat(timer.ssr, performance.now())}.`));

	timer.generate = performance.now();
	if (opts.buildConfig.staticMode) {
		await generatePages(ssrResult, opts, internals, facadeIdToPageDataMap);
		await cleanSsrOutput(opts);
	} else {
		info(opts.logging, null, `\n${bgMagenta(black(' finalizing server assets '))}\n`);
		await ssrMoveAssets(opts);
	}
}

async function ssrBuild(opts: StaticBuildOptions, internals: BuildInternals, input: Set<string>) {
	const { astroConfig, viteConfig } = opts;
	const ssr = isBuildingToSSR(astroConfig);
	const out = ssr ? opts.buildConfig.server : astroConfig.outDir;

	const viteBuildConfig = {
		logLevel: 'error',
		mode: 'production',
		css: viteConfig.css,
		build: {
			...viteConfig.build,
			emptyOutDir: false,
			manifest: false,
			outDir: fileURLToPath(out),
			rollupOptions: {
				input: [],
				output: {
					format: 'esm',
					entryFileNames: opts.buildConfig.serverEntry,
					chunkFileNames: 'chunks/chunk.[hash].mjs',
					assetFileNames: 'assets/asset.[hash][extname]',
				},
			},
			ssr: true,
			// must match an esbuild target
			target: 'esnext',
			// improve build performance
			minify: false,
			polyfillModulePreload: false,
			reportCompressedSize: false,
		},
		plugins: [
			vitePluginInternals(input, internals),
			vitePluginPages(opts, internals),
			rollupPluginAstroBuildCSS({
				internals,
				legacy: false,
			}),
			...(viteConfig.plugins || []),
			// SSR needs to be last
			isBuildingToSSR(opts.astroConfig) &&
				vitePluginSSR(opts, internals, opts.astroConfig._ctx.adapter!),
		],
		publicDir: ssr ? false : viteConfig.publicDir,
		root: viteConfig.root,
		envPrefix: 'PUBLIC_',
		server: viteConfig.server,
		base: astroConfig.site ? new URL(astroConfig.site).pathname : '/',
		ssr: viteConfig.ssr,
		resolve: viteConfig.resolve,
	} as ViteConfigWithSSR;

	await runHookBuildSetup({ config: astroConfig, vite: viteBuildConfig, target: 'server' });

	// TODO: use vite.mergeConfig() here?
	return await vite.build(viteBuildConfig);
}

async function clientBuild(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	input: Set<string>
) {
	const { astroConfig, viteConfig } = opts;
	const timer = performance.now();
	const ssr = isBuildingToSSR(astroConfig);
	const out = ssr ? opts.buildConfig.client : astroConfig.outDir;

	// Nothing to do if there is no client-side JS.
	if (!input.size) {
		// If SSR, copy public over
		if (ssr) {
			await copyFiles(astroConfig.publicDir, out);
		}

		return null;
	}

	// TODO: use vite.mergeConfig() here?
	info(opts.logging, null, `\n${bgGreen(black(' building client '))}`);

	const viteBuildConfig = {
		logLevel: 'info',
		mode: 'production',
		css: viteConfig.css,
		build: {
			emptyOutDir: false,
			minify: 'esbuild',
			outDir: fileURLToPath(out),
			rollupOptions: {
				input: Array.from(input),
				output: {
					format: 'esm',
					entryFileNames: 'entry.[hash].js',
					chunkFileNames: 'chunks/chunk.[hash].js',
					assetFileNames: 'assets/asset.[hash][extname]',
				},
				preserveEntrySignatures: 'exports-only',
			},
			target: 'esnext', // must match an esbuild target
		},
		plugins: [
			vitePluginInternals(input, internals),
			vitePluginHoistedScripts(astroConfig, internals),
			rollupPluginAstroBuildCSS({
				internals,
				legacy: false,
			}),
			...(viteConfig.plugins || []),
		],
		publicDir: viteConfig.publicDir,
		root: viteConfig.root,
		envPrefix: 'PUBLIC_',
		server: viteConfig.server,
		base: astroConfig.base,
	} as ViteConfigWithSSR;

	await runHookBuildSetup({ config: astroConfig, vite: viteBuildConfig, target: 'client' });

	const buildResult = await vite.build(viteBuildConfig);
	info(opts.logging, null, dim(`Completed in ${getTimeStat(timer, performance.now())}.\n`));
	return buildResult;
}

async function cleanSsrOutput(opts: StaticBuildOptions) {
	// The SSR output is all .mjs files, the client output is not.
	const files = await glob('**/*.mjs', {
		cwd: fileURLToPath(opts.astroConfig.outDir),
	});
	await Promise.all(
		files.map(async (filename) => {
			const url = new URL(filename, opts.astroConfig.outDir);
			await fs.promises.rm(url);
		})
	);
}

async function copyFiles(fromFolder: URL, toFolder: URL) {
	const files = await glob('**/*', {
		cwd: fileURLToPath(fromFolder),
	});

	// Make the directory
	await fs.promises.mkdir(toFolder, { recursive: true });

	await Promise.all(
		files.map(async (filename) => {
			const from = new URL(filename, fromFolder);
			const to = new URL(filename, toFolder);
			return fs.promises.copyFile(from, to);
		})
	);
}

async function ssrMoveAssets(opts: StaticBuildOptions) {
	info(opts.logging, 'build', 'Rearranging server assets...');
	const serverRoot = opts.buildConfig.staticMode
		? opts.buildConfig.client
		: opts.buildConfig.server;
	const clientRoot = opts.buildConfig.client;
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

	removeDir(serverAssets);
}
