import type { RollupOutput } from 'rollup';
import type { BuildInternals } from '../../core/build/internal.js';
import type { ViteConfigWithSSR } from '../create-vite';
import type { PageBuildData, StaticBuildOptions } from './types';

import glob from 'fast-glob';
import fs from 'fs';
import npath from 'path';
import { fileURLToPath } from 'url';
import * as vite from 'vite';
import { createBuildInternals } from '../../core/build/internal.js';
import { appendForwardSlash, prependForwardSlash } from '../../core/path.js';
import { emptyDir, removeDir } from '../../core/util.js';
import { rollupPluginAstroBuildCSS } from '../../vite-plugin-build-css/index.js';
import { vitePluginHoistedScripts } from './vite-plugin-hoisted-scripts.js';
import { vitePluginInternals } from './vite-plugin-internals.js';
import { vitePluginSSR } from './vite-plugin-ssr.js';
import { generatePages } from './generate.js';
import { getClientRoot, getServerRoot, getOutRoot } from './common.js';

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
	for (const [component, pageData] of Object.entries(allPages)) {
		const astroModuleURL = new URL('./' + component, astroConfig.projectRoot);
		const astroModuleId = prependForwardSlash(component);

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
				...renderers.filter((renderer) => !!renderer.clientEntrypoint).map((renderer) => renderer.clientEntrypoint!),
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

	// Run client build first, so the assets can be fed into the SSR rendered version.
	await clientBuild(opts, internals, jsInput);

	// Build your project (SSR application code, assets, client JS, etc.)
	const ssrResult = (await ssrBuild(opts, internals, pageInput)) as RollupOutput;

	if (opts.buildConfig.staticMode) {
		await generatePages(ssrResult, opts, internals, facadeIdToPageDataMap);
		await cleanSsrOutput(opts);
	} else {
		await ssrMoveAssets(opts);
	}
}

async function ssrBuild(opts: StaticBuildOptions, internals: BuildInternals, input: Set<string>) {
	const { astroConfig, viteConfig } = opts;
	const ssr = astroConfig.buildOptions.experimentalSsr;
	const out = ssr ? getServerRoot(astroConfig) : getOutRoot(astroConfig);
	// TODO: use vite.mergeConfig() here?
	return await vite.build({
		logLevel: 'error',
		mode: 'production',
		css: viteConfig.css,
		build: {
			...viteConfig.build,
			emptyOutDir: false,
			manifest: false,
			outDir: fileURLToPath(out),
			ssr: true,
			rollupOptions: {
				input: Array.from(input),
				output: {
					format: 'esm',
					entryFileNames: 'entry.[hash].mjs',
					chunkFileNames: 'chunks/chunk.[hash].mjs',
					assetFileNames: 'assets/asset.[hash][extname]',
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
			vitePluginInternals(input, internals),
			rollupPluginAstroBuildCSS({
				internals,
			}),
			...(viteConfig.plugins || []),
			// SSR needs to be last
			opts.astroConfig._ctx.adapter?.serverEntrypoint && vitePluginSSR(opts, internals, opts.astroConfig._ctx.adapter),
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

	// TODO: use vite.mergeConfig() here?
	return await vite.build({
		logLevel: 'error',
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

	removeDir(serverAssets);
}
