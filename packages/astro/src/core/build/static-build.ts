import glob from 'fast-glob';
import fs from 'fs';
import { bgGreen, bgMagenta, black, dim } from 'kleur/colors';
import { fileURLToPath } from 'url';
import * as vite from 'vite';
import { BuildInternals, createBuildInternals } from '../../core/build/internal.js';
import { prependForwardSlash } from '../../core/path.js';
import { emptyDir, isModeServerWithNoAdapter, removeDir } from '../../core/util.js';
import { runHookBuildSetup } from '../../integrations/index.js';
import { rollupPluginAstroBuildCSS } from './vite-plugin-css.js';
import { PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import type { ViteConfigWithSSR } from '../create-vite';
import { info } from '../logger/core.js';
import { generatePages } from './generate.js';
import { trackPageData } from './internal.js';
import type { PageBuildData, StaticBuildOptions } from './types';
import { getTimeStat } from './util.js';
import { vitePluginAnalyzer } from './vite-plugin-analyzer.js';
import { vitePluginHoistedScripts } from './vite-plugin-hoisted-scripts.js';
import { vitePluginInternals } from './vite-plugin-internals.js';
import { vitePluginPages } from './vite-plugin-pages.js';
import { injectManifest, vitePluginSSR } from './vite-plugin-ssr.js';

export async function staticBuild(opts: StaticBuildOptions) {
	const { allPages, astroConfig } = opts;

	// Verify this app is buildable.
	if (isModeServerWithNoAdapter(opts.astroConfig)) {
		throw new Error(`Cannot use \`output: 'server'\` without an adapter.
Install and configure the appropriate server adapter for your final deployment.
Example:

  // astro.config.js
  import netlify from '@astrojs/netlify';
  export default {
    output: 'server',
    adapter: netlify(),
  }
`);
	}

	// The pages to be built for rendering purposes.
	const pageInput = new Set<string>();

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

		pageInput.add(astroModuleId);
		facadeIdToPageDataMap.set(fileURLToPath(astroModuleURL), pageData);
	}

	// Empty out the dist folder, if needed. Vite has a config for doing this
	// but because we are running 2 vite builds in parallel, that would cause a race
	// condition, so we are doing it ourselves
	emptyDir(astroConfig.outDir, new Set('.git'));

	// Build your project (SSR application code, assets, client JS, etc.)
	timer.ssr = performance.now();
	info(opts.logging, 'build', `Building ${astroConfig.output} entrypoints...`);
	await ssrBuild(opts, internals, pageInput);
	info(opts.logging, 'build', dim(`Completed in ${getTimeStat(timer.ssr, performance.now())}.`));

	const rendererClientEntrypoints = opts.astroConfig._ctx.renderers
		.map((r) => r.clientEntrypoint)
		.filter((a) => typeof a === 'string') as string[];

	const clientInput = new Set([
		...internals.discoveredHydratedComponents,
		...internals.discoveredClientOnlyComponents,
		...rendererClientEntrypoints,
		...internals.discoveredScripts,
	]);

	if (astroConfig._ctx.scripts.some((script) => script.stage === 'page')) {
		clientInput.add(PAGE_SCRIPT_ID);
	}

	// Run client build first, so the assets can be fed into the SSR rendered version.
	timer.clientBuild = performance.now();
	await clientBuild(opts, internals, clientInput);

	timer.generate = performance.now();
	if (astroConfig.output === 'static') {
		try {
			await generatePages(opts, internals);
		} finally {
			await cleanSsrOutput(opts);
		}
	} else {
		// Inject the manifest
		await injectManifest(opts, internals);

		info(opts.logging, null, `\n${bgMagenta(black(' finalizing server assets '))}\n`);
		await ssrMoveAssets(opts);
	}
}

async function ssrBuild(opts: StaticBuildOptions, internals: BuildInternals, input: Set<string>) {
	const { astroConfig, viteConfig } = opts;
	const ssr = astroConfig.output === 'server';
	const out = ssr ? opts.buildConfig.server : astroConfig.outDir;

	const viteBuildConfig: ViteConfigWithSSR = {
		logLevel: opts.viteConfig.logLevel ?? 'error',
		mode: 'production',
		css: viteConfig.css,
		optimizeDeps: {
			include: [...(viteConfig.optimizeDeps?.include ?? [])],
			exclude: [...(viteConfig.optimizeDeps?.exclude ?? [])],
		},
		build: {
			...viteConfig.build,
			emptyOutDir: false,
			manifest: false,
			outDir: fileURLToPath(out),
			rollupOptions: {
				input: [],
				output: {
					format: 'esm',
					chunkFileNames: 'chunks/[name].[hash].mjs',
					assetFileNames: 'assets/[name].[hash][extname]',
					...viteConfig.build?.rollupOptions?.output,
					entryFileNames: opts.buildConfig.serverEntry,
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
				buildOptions: opts,
				internals,
				target: 'server',
				astroConfig,
			}),
			...(viteConfig.plugins || []),
			// SSR needs to be last
			opts.astroConfig.output === 'server' &&
				vitePluginSSR(internals, opts.astroConfig._ctx.adapter!),
			vitePluginAnalyzer(internals),
		],
		publicDir: ssr ? false : viteConfig.publicDir,
		root: viteConfig.root,
		envPrefix: 'PUBLIC_',
		server: viteConfig.server,
		base: astroConfig.base,
		ssr: viteConfig.ssr,
		resolve: viteConfig.resolve,
	};

	await runHookBuildSetup({
		config: astroConfig,
		pages: internals.pagesByComponent,
		vite: viteBuildConfig,
		target: 'server',
	});

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
	const ssr = astroConfig.output === 'server';
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
		optimizeDeps: {
			include: [...(viteConfig.optimizeDeps?.include ?? [])],
			exclude: [...(viteConfig.optimizeDeps?.exclude ?? [])],
		},
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
					...viteConfig.build?.rollupOptions?.output,
				},
				preserveEntrySignatures: 'exports-only',
			},
			target: 'esnext', // must match an esbuild target
		},
		plugins: [
			vitePluginInternals(input, internals),
			vitePluginHoistedScripts(astroConfig, internals),
			rollupPluginAstroBuildCSS({
				buildOptions: opts,
				internals,
				target: 'client',
				astroConfig,
			}),
			...(viteConfig.plugins || []),
		],
		publicDir: viteConfig.publicDir,
		root: viteConfig.root,
		envPrefix: 'PUBLIC_',
		server: viteConfig.server,
		base: astroConfig.base,
	} as ViteConfigWithSSR;

	await runHookBuildSetup({
		config: astroConfig,
		pages: internals.pagesByComponent,
		vite: viteBuildConfig,
		target: 'client',
	});

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

	await Promise.all(
		files.map(async (filename) => {
			const from = new URL(filename, fromFolder);
			const to = new URL(filename, toFolder);
			const lastFolder = new URL('./', to);
			return fs.promises
				.mkdir(lastFolder, { recursive: true })
				.then(() => fs.promises.copyFile(from, to));
		})
	);
}

async function ssrMoveAssets(opts: StaticBuildOptions) {
	info(opts.logging, 'build', 'Rearranging server assets...');
	const serverRoot =
		opts.astroConfig.output === 'static' ? opts.buildConfig.client : opts.buildConfig.server;
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
