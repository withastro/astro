import { teardown } from '@astrojs/compiler';
import * as eslexer from 'es-module-lexer';
import glob from 'fast-glob';
import { bgGreen, bgMagenta, black, dim } from 'kleur/colors';
import fs from 'node:fs';
import path, { extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as vite from 'vite';
import type { RouteData } from '../../@types/astro.js';
import {
	createBuildInternals,
	eachPageData,
	type BuildInternals,
} from '../../core/build/internal.js';
import { emptyDir, removeEmptyDirs } from '../../core/fs/index.js';
import { appendForwardSlash, prependForwardSlash, removeFileExtension } from '../../core/path.js';
import { isModeServerWithNoAdapter } from '../../core/util.js';
import { runHookBuildSetup } from '../../integrations/index.js';
import { getOutputDirectory, isServerLikeOutput } from '../../prerender/utils.js';
import { PAGE_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { routeIsRedirect } from '../redirects/index.js';
import { getOutDirWithinCwd } from './common.js';
import { generatePages } from './generate.js';
import { trackPageData } from './internal.js';
import { createPluginContainer, type AstroBuildPluginContainer } from './plugin.js';
import { registerAllPlugins } from './plugins/index.js';
import { RESOLVED_SSR_MANIFEST_VIRTUAL_MODULE_ID } from './plugins/plugin-manifest.js';
import { ASTRO_PAGE_RESOLVED_MODULE_ID } from './plugins/plugin-pages.js';
import { RESOLVED_RENDERERS_MODULE_ID } from './plugins/plugin-renderers.js';
import { RESOLVED_SPLIT_MODULE_ID, RESOLVED_SSR_VIRTUAL_MODULE_ID } from './plugins/plugin-ssr.js';
import { ASTRO_PAGE_EXTENSION_POST_PATTERN } from './plugins/util.js';
import type { PageBuildData, StaticBuildOptions } from './types.js';
import { getTimeStat } from './util.js';
import { hasContentFlag } from '../../content/utils.js';
import { CONTENT_FLAGS, CONTENT_RENDER_FLAG, PROPAGATED_ASSET_FLAG } from '../../content/consts.js';

export async function viteBuild(opts: StaticBuildOptions) {
	const { allPages, settings } = opts;

	// Make sure we have an adapter before building
	if (isModeServerWithNoAdapter(opts.settings)) {
		throw new AstroError(AstroErrorData.NoAdapterInstalled);
	}

	settings.timer.start('SSR build');

	// The pages to be built for rendering purposes.
	const pageInput = new Set<string>();

	// A map of each page .astro file, to the PageBuildData which contains information
	// about that page, such as its paths.
	const facadeIdToPageDataMap = new Map<string, PageBuildData>();

	// Build internals needed by the CSS plugin
	const internals = createBuildInternals();

	for (const [component, pageData] of Object.entries(allPages)) {
		const astroModuleURL = new URL('./' + component, settings.config.root);
		const astroModuleId = prependForwardSlash(component);

		// Track the page data in internals
		trackPageData(internals, component, pageData, astroModuleId, astroModuleURL);

		if (!routeIsRedirect(pageData.route)) {
			pageInput.add(astroModuleId);
			facadeIdToPageDataMap.set(fileURLToPath(astroModuleURL), pageData);
		}
	}

	// Empty out the dist folder, if needed. Vite has a config for doing this
	// but because we are running 2 vite builds in parallel, that would cause a race
	// condition, so we are doing it ourselves
	if (settings.config?.vite?.build?.emptyOutDir !== false) {
		emptyDir(settings.config.outDir, new Set('.git'));
	}

	// Register plugins
	const container = createPluginContainer(opts, internals);
	registerAllPlugins(container);

	let buildContent = async () => {
		const contentTime = performance.now();
		opts.logger.info('content', `Building collections...`);
		await contentBuild(opts, internals, new Set(), container);
		opts.logger.info('content', dim(`Completed in ${getTimeStat(contentTime, performance.now())}.`));	
	}

	let ssrOutput: any;
	let buildServer = async () => {
		// Build your project (SSR application code, assets, client JS, etc.)
		const ssrTime = performance.now();
		opts.logger.info('build', `Building ${settings.config.output} entrypoints...`);
		ssrOutput = await ssrBuild(opts, internals, pageInput, container);
		opts.logger.info('build', dim(`Completed in ${getTimeStat(ssrTime, performance.now())}.`));

		settings.timer.end('SSR build');	
	}

	await Promise.all([buildContent(), buildServer()]);

	settings.timer.start('Client build');

	const rendererClientEntrypoints = settings.renderers
		.map((r) => r.clientEntrypoint)
		.filter((a) => typeof a === 'string') as string[];

	const clientInput = new Set([
		...internals.discoveredHydratedComponents.keys(),
		...internals.discoveredClientOnlyComponents.keys(),
		...rendererClientEntrypoints,
		...internals.discoveredScripts,
	]);

	if (settings.scripts.some((script) => script.stage === 'page')) {
		clientInput.add(PAGE_SCRIPT_ID);
	}

	// Run client build first, so the assets can be fed into the SSR rendered version.
	const clientOutput = await clientBuild(opts, internals, clientInput, container);

	await runPostBuildHooks(container, ssrOutput, clientOutput);

	settings.timer.end('Client build');

	// Free up memory
	internals.ssrEntryChunk = undefined;
	if (opts.teardownCompiler) {
		teardown();
	}

	return { internals };
}

export async function staticBuild(opts: StaticBuildOptions, internals: BuildInternals) {
	const { settings } = opts;
	switch (true) {
		case settings.config.output === 'static': {
			settings.timer.start('Static generate');
			await generatePages(opts, internals);
			await cleanServerOutput(opts);
			settings.timer.end('Static generate');
			return;
		}
		case isServerLikeOutput(settings.config): {
			settings.timer.start('Server generate');
			await generatePages(opts, internals);
			await cleanStaticOutput(opts, internals);
			opts.logger.info(null, `\n${bgMagenta(black(' finalizing server assets '))}\n`);
			await ssrMoveAssets(opts);
			settings.timer.end('Server generate');
			return;
		}
	}
}

async function ssrBuild(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	input: Set<string>,
	container: AstroBuildPluginContainer
) {
	const { allPages, settings, viteConfig } = opts;
	const ssr = isServerLikeOutput(settings.config);
	const out = getOutputDirectory(settings.config);
	const routes = Object.values(allPages).map((pd) => pd.route);
	const { lastVitePlugins, vitePlugins } = await container.runBeforeHook('server', input);

	const viteBuildConfig: vite.InlineConfig = {
		...viteConfig,
		mode: viteConfig.mode || 'production',
		// Check using `settings...` as `viteConfig` always defaults to `warn` by Astro
		logLevel: settings.config.vite.logLevel ?? 'error',
		build: {
			target: 'esnext',
			// Vite defaults cssMinify to false in SSR by default, but we want to minify it
			// as the CSS generated are used and served to the client.
			cssMinify: viteConfig.build?.minify == null ? true : !!viteConfig.build?.minify,
			...viteConfig.build,
			emptyOutDir: false,
			manifest: false,
			outDir: fileURLToPath(out),
			copyPublicDir: !ssr,
			rollupOptions: {
				...viteConfig.build?.rollupOptions,
				input: [],
				output: {
					format: 'esm',
					// Server chunks can't go in the assets (_astro) folder
					// We need to keep these separate
					chunkFileNames(chunkInfo) {
						const { name } = chunkInfo;
						// Sometimes chunks have the `@_@astro` suffix due to SSR logic. Remove it!
						// TODO: refactor our build logic to avoid this
						if (name.includes(ASTRO_PAGE_EXTENSION_POST_PATTERN)) {
							const [sanitizedName] = name.split(ASTRO_PAGE_EXTENSION_POST_PATTERN);
							return `chunks/${sanitizedName}_[hash].mjs`;
						}
						// Injected routes include "pages/[name].[ext]" already. Clean those up!
						if (name.startsWith('pages/')) {
							const sanitizedName = name.split('.')[0];
							return `chunks/${sanitizedName}_[hash].mjs`;
						}
						// Detect if the chunk name has as % sign that is not encoded.
						// This is borrowed from Node core: https://github.com/nodejs/node/blob/3838b579e44bf0c2db43171c3ce0da51eb6b05d5/lib/internal/url.js#L1382-L1391
						// We do this because you cannot import a module with this character in it.
						for (let i = 0; i < name.length; i++) {
							if (name[i] === '%') {
								const third = name.codePointAt(i + 2)! | 0x20;
								if (name[i + 1] !== '2' || third !== 102) {
									return `chunks/${name.replace(/%/g, '_percent_')}_[hash].mjs`;
								}
							}
						}
						return `chunks/[name]_[hash].mjs`;
					},
					assetFileNames: `${settings.config.build.assets}/[name].[hash][extname]`,
					...viteConfig.build?.rollupOptions?.output,
					entryFileNames(chunkInfo) {
						if (chunkInfo.facadeModuleId?.startsWith(ASTRO_PAGE_RESOLVED_MODULE_ID)) {
							return makeAstroPageEntryPointFileName(
								ASTRO_PAGE_RESOLVED_MODULE_ID,
								chunkInfo.facadeModuleId,
								routes
							);
						} else if (chunkInfo.facadeModuleId?.startsWith(RESOLVED_SPLIT_MODULE_ID)) {
							return makeSplitEntryPointFileName(chunkInfo.facadeModuleId, routes);
						} else if (chunkInfo.facadeModuleId === RESOLVED_SSR_VIRTUAL_MODULE_ID) {
							return opts.settings.config.build.serverEntry;
						} else if (chunkInfo.facadeModuleId === RESOLVED_RENDERERS_MODULE_ID) {
							return 'renderers.mjs';
						} else if (chunkInfo.facadeModuleId === RESOLVED_SSR_MANIFEST_VIRTUAL_MODULE_ID) {
							return 'manifest_[hash].mjs';
						} else {
							return '[name].mjs';
						}
					},
				},
			},
			ssr: true,
			ssrEmitAssets: true,
			// improve build performance
			minify: false,
			modulePreload: { polyfill: false },
			reportCompressedSize: false,
		},
		plugins: [...vitePlugins, ...(viteConfig.plugins || []), ...lastVitePlugins],
		envPrefix: viteConfig.envPrefix ?? 'PUBLIC_',
		base: settings.config.base,
	};

	const updatedViteBuildConfig = await runHookBuildSetup({
		config: settings.config,
		pages: internals.pagesByComponent,
		vite: viteBuildConfig,
		target: 'server',
		logger: opts.logger,
	});

	return await vite.build(updatedViteBuildConfig);
}

async function contentBuild(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	input: Set<string>,
	container: AstroBuildPluginContainer
) {
	const { settings, viteConfig } = opts;
	const ssr = isServerLikeOutput(settings.config);
	const out = getOutputDirectory(settings.config);
	const { lastVitePlugins, vitePlugins } = await container.runBeforeHook('content', input);

	const viteBuildConfig: vite.InlineConfig = {
		...viteConfig,
		mode: viteConfig.mode || 'production',
		// Check using `settings...` as `viteConfig` always defaults to `warn` by Astro
		logLevel: settings.config.vite.logLevel ?? 'error',
		build: {
			target: 'esnext',
			// Vite defaults cssMinify to false in SSR by default, but we want to minify it
			// as the CSS generated are used and served to the client.
			cssMinify: viteConfig.build?.minify == null ? true : !!viteConfig.build?.minify,
			...viteConfig.build,
			emptyOutDir: false,
			manifest: false,
			outDir: fileURLToPath(out),
			copyPublicDir: !ssr,
			rollupOptions: {
				...viteConfig.build?.rollupOptions,
				input: [],
				output: {
					format: 'esm',
					chunkFileNames(info) {
						if (info.moduleIds.length === 1) {
							const url = pathToFileURL(info.moduleIds[0]);
							const distRelative = url.toString().replace(settings.config.srcDir.toString(), '')
							let entryFileName = removeFileExtension(distRelative);
							return `${entryFileName}.render.mjs`;
						}
						return '[name]_[hash].mjs';
					},
					...viteConfig.build?.rollupOptions?.output,
					entryFileNames(info) {
						const params = new URLSearchParams(info.moduleIds[0].split('?').pop() ?? '');
						const flags = Array.from(params.keys());
						const url = pathToFileURL(info.moduleIds[0]);
						const distRelative = url.toString().replace(settings.config.srcDir.toString(), '')

						let entryFileName = removeFileExtension(distRelative);
						if (flags[0] === PROPAGATED_ASSET_FLAG) {
							entryFileName += `.assets`
						} else if (flags[0] === CONTENT_RENDER_FLAG) {
							entryFileName += '.render'
						}
						return `${entryFileName}.mjs`;
					},
					assetFileNames: `${settings.config.build.assets}/[name].[extname]`,
				},
			},
			ssr: true,
			ssrEmitAssets: true,
			// improve build performance
			minify: false,
			modulePreload: { polyfill: false },
			reportCompressedSize: false,
		},
		plugins: [...vitePlugins, ...(viteConfig.plugins || []), ...lastVitePlugins],
		envPrefix: viteConfig.envPrefix ?? 'PUBLIC_',
		base: settings.config.base,
	};

	const updatedViteBuildConfig = await runHookBuildSetup({
		config: settings.config,
		pages: internals.pagesByComponent,
		vite: viteBuildConfig,
		target: 'server',
		logger: opts.logger,
	});

	return await vite.build(updatedViteBuildConfig);
}

async function clientBuild(
	opts: StaticBuildOptions,
	internals: BuildInternals,
	input: Set<string>,
	container: AstroBuildPluginContainer
) {
	const { settings, viteConfig } = opts;
	const timer = performance.now();
	const ssr = isServerLikeOutput(settings.config);
	const out = ssr ? settings.config.build.client : getOutDirWithinCwd(settings.config.outDir);

	// Nothing to do if there is no client-side JS.
	if (!input.size) {
		// If SSR, copy public over
		if (ssr) {
			await copyFiles(settings.config.publicDir, out, true);
		}

		return null;
	}

	const { lastVitePlugins, vitePlugins } = await container.runBeforeHook('client', input);
	opts.logger.info(null, `\n${bgGreen(black(' building client '))}`);

	const viteBuildConfig: vite.InlineConfig = {
		...viteConfig,
		mode: viteConfig.mode || 'production',
		// Check using `settings...` as `viteConfig` always defaults to `warn` by Astro
		logLevel: settings.config.vite.logLevel ?? 'info',
		build: {
			target: 'esnext',
			...viteConfig.build,
			emptyOutDir: false,
			outDir: fileURLToPath(out),
			rollupOptions: {
				...viteConfig.build?.rollupOptions,
				input: Array.from(input),
				output: {
					format: 'esm',
					entryFileNames: `${settings.config.build.assets}/[name].[hash].js`,
					chunkFileNames: `${settings.config.build.assets}/[name].[hash].js`,
					assetFileNames: `${settings.config.build.assets}/[name].[hash][extname]`,
					...viteConfig.build?.rollupOptions?.output,
				},
				preserveEntrySignatures: 'exports-only',
			},
		},
		plugins: [...vitePlugins, ...(viteConfig.plugins || []), ...lastVitePlugins],
		envPrefix: viteConfig.envPrefix ?? 'PUBLIC_',
		base: settings.config.base,
	};

	await runHookBuildSetup({
		config: settings.config,
		pages: internals.pagesByComponent,
		vite: viteBuildConfig,
		target: 'client',
		logger: opts.logger,
	});

	const buildResult = await vite.build(viteBuildConfig);
	opts.logger.info(null, dim(`Completed in ${getTimeStat(timer, performance.now())}.\n`));
	return buildResult;
}

async function runPostBuildHooks(
	container: AstroBuildPluginContainer,
	ssrReturn: Awaited<ReturnType<typeof ssrBuild>>,
	clientReturn: Awaited<ReturnType<typeof clientBuild>>
) {
	const mutations = await container.runPostHook(ssrReturn, clientReturn);
	const config = container.options.settings.config;
	const build = container.options.settings.config.build;
	for (const [fileName, mutation] of mutations) {
		const root = isServerLikeOutput(config)
			? mutation.targets.includes('server')
				? build.server
				: build.client
			: config.outDir;
		const fullPath = path.join(fileURLToPath(root), fileName);
		const fileURL = pathToFileURL(fullPath);
		await fs.promises.mkdir(new URL('./', fileURL), { recursive: true });
		await fs.promises.writeFile(fileURL, mutation.code, 'utf-8');
	}
}

/**
 * For each statically prerendered page, replace their SSR file with a noop.
 * This allows us to run the SSR build only once, but still remove dependencies for statically rendered routes.
 */
async function cleanStaticOutput(opts: StaticBuildOptions, internals: BuildInternals) {
	const allStaticFiles = new Set();
	for (const pageData of eachPageData(internals)) {
		if (pageData.route.prerender) {
			const { moduleSpecifier } = pageData;
			const pageBundleId = internals.pageToBundleMap.get(moduleSpecifier);
			const entryBundleId = internals.entrySpecifierToBundleMap.get(moduleSpecifier);
			allStaticFiles.add(pageBundleId ?? entryBundleId);
		}
	}
	const ssr = isServerLikeOutput(opts.settings.config);
	const out = ssr
		? opts.settings.config.build.server
		: getOutDirWithinCwd(opts.settings.config.outDir);
	// The SSR output is all .mjs files, the client output is not.
	const files = await glob('**/*.mjs', {
		cwd: fileURLToPath(out),
	});

	if (files.length) {
		await eslexer.init;

		// Cleanup prerendered chunks.
		// This has to happen AFTER the SSR build runs as a final step, because we need the code in order to generate the pages.
		// These chunks should only contain prerendering logic, so they are safe to modify.
		await Promise.all(
			files.map(async (filename) => {
				if (!allStaticFiles.has(filename)) {
					return;
				}
				const url = new URL(filename, out);
				const text = await fs.promises.readFile(url, { encoding: 'utf8' });
				const [, exports] = eslexer.parse(text);
				// Replace exports (only prerendered pages) with a noop
				let value = 'const noop = () => {};';
				for (const e of exports) {
					if (e.n === 'default') value += `\n export default noop;`;
					else value += `\nexport const ${e.n} = noop;`;
				}
				await fs.promises.writeFile(url, value, { encoding: 'utf8' });
			})
		);

		removeEmptyDirs(out);
	}
}

async function cleanServerOutput(opts: StaticBuildOptions) {
	const out = getOutDirWithinCwd(opts.settings.config.outDir);
	// The SSR output is all .mjs files, the client output is not.
	const files = await glob('**/*.mjs', {
		cwd: fileURLToPath(out),
		// Important! Also cleanup dotfiles like `node_modules/.pnpm/**`
		dot: true,
	});
	if (files.length) {
		// Remove all the SSR generated .mjs files
		await Promise.all(
			files.map(async (filename) => {
				const url = new URL(filename, out);
				await fs.promises.rm(url);
			})
		);

		removeEmptyDirs(out);
	}

	// Clean out directly if the outDir is outside of root
	if (out.toString() !== opts.settings.config.outDir.toString()) {
		// Copy assets before cleaning directory if outside root
		await copyFiles(out, opts.settings.config.outDir);
		await fs.promises.rm(out, { recursive: true });
		return;
	}
}

async function copyFiles(fromFolder: URL, toFolder: URL, includeDotfiles = false) {
	const files = await glob('**/*', {
		cwd: fileURLToPath(fromFolder),
		dot: includeDotfiles,
	});

	await Promise.all(
		files.map(async (filename) => {
			const from = new URL(filename, fromFolder);
			const to = new URL(filename, toFolder);
			const lastFolder = new URL('./', to);
			return fs.promises
				.mkdir(lastFolder, { recursive: true })
				.then(() => fs.promises.copyFile(from, to, fs.constants.COPYFILE_FICLONE));
		})
	);
}

async function ssrMoveAssets(opts: StaticBuildOptions) {
	opts.logger.info('build', 'Rearranging server assets...');
	const serverRoot =
		opts.settings.config.output === 'static'
			? opts.settings.config.build.client
			: opts.settings.config.build.server;
	const clientRoot = opts.settings.config.build.client;
	const assets = opts.settings.config.build.assets;
	const serverAssets = new URL(`./${assets}/`, appendForwardSlash(serverRoot.toString()));
	const clientAssets = new URL(`./${assets}/`, appendForwardSlash(clientRoot.toString()));
	const files = await glob(`**/*`, {
		cwd: fileURLToPath(serverAssets),
	});

	if (files.length > 0) {
		await Promise.all(
			files.map(async (filename) => {
				const currentUrl = new URL(filename, appendForwardSlash(serverAssets.toString()));
				const clientUrl = new URL(filename, appendForwardSlash(clientAssets.toString()));
				const dir = new URL(path.parse(clientUrl.href).dir);
				// It can't find this file because the user defines a custom path
				// that includes the folder paths in `assetFileNames
				if (!fs.existsSync(dir)) await fs.promises.mkdir(dir, { recursive: true });
				return fs.promises.rename(currentUrl, clientUrl);
			})
		);
		removeEmptyDirs(serverAssets);
	}
}

/**
 * This function takes the virtual module name of any page entrypoint and
 * transforms it to generate a final `.mjs` output file.
 *
 * Input: `@astro-page:src/pages/index@_@astro`
 * Output: `pages/index.astro.mjs`
 * Input: `@astro-page:../node_modules/my-dep/injected@_@astro`
 * Output: `pages/injected.mjs`
 *
 * 1. We clean the `facadeModuleId` by removing the `ASTRO_PAGE_MODULE_ID` prefix and `ASTRO_PAGE_EXTENSION_POST_PATTERN`.
 * 2. We find the matching route pattern in the manifest (or fallback to the cleaned module id)
 * 3. We replace square brackets with underscore (`[slug]` => `_slug_`) and `...` with `` (`[...slug]` => `_---slug_`).
 * 4. We append the `.mjs` extension, so the file will always be an ESM module
 *
 * @param prefix string
 * @param facadeModuleId string
 * @param pages AllPagesData
 */
export function makeAstroPageEntryPointFileName(
	prefix: string,
	facadeModuleId: string,
	routes: RouteData[]
) {
	const pageModuleId = facadeModuleId
		.replace(prefix, '')
		.replace(ASTRO_PAGE_EXTENSION_POST_PATTERN, '.');
	const route = routes.find((routeData) => routeData.component === pageModuleId);
	const name = route?.route ?? pageModuleId;
	return `pages${name
		.replace(/\/$/, '/index')
		.replaceAll(/[\[\]]/g, '_')
		.replaceAll('...', '---')}.astro.mjs`;
}

/**
 * The `facadeModuleId` has a shape like: \0@astro-serverless-page:src/pages/index@_@astro.
 *
 * 1. We call `makeAstroPageEntryPointFileName` which normalise its name, making it like a file path
 * 2. We split the file path using the file system separator and attempt to retrieve the last entry
 * 3. The last entry should be the file
 * 4. We prepend the file name with `entry.`
 * 5. We built the file path again, using the new entry built in the previous step
 *
 * @param facadeModuleId
 * @param opts
 */
export function makeSplitEntryPointFileName(facadeModuleId: string, routes: RouteData[]) {
	const filePath = `${makeAstroPageEntryPointFileName(
		RESOLVED_SPLIT_MODULE_ID,
		facadeModuleId,
		routes
	)}`;

	const pathComponents = filePath.split(path.sep);
	const lastPathComponent = pathComponents.pop();
	if (lastPathComponent) {
		const extension = extname(lastPathComponent);
		if (extension.length > 0) {
			const newFileName = `entry.${lastPathComponent}`;
			return [...pathComponents, newFileName].join(path.sep);
		}
	}
	return filePath;
}
