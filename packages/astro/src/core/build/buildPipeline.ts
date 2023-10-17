import type { AstroConfig, AstroSettings, SSRLoadedRenderer } from '../../@types/astro.js';
import { getOutputDirectory, isServerLikeOutput } from '../../prerender/utils.js';
import { BEFORE_HYDRATION_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import type { SSRManifest } from '../app/types.js';
import { Logger } from '../logger/core.js';
import { Pipeline } from '../pipeline.js';
import { createEnvironment } from '../render/index.js';
import { createAssetLink } from '../render/ssr-element.js';
import type { BuildInternals } from './internal.js';
import { ASTRO_PAGE_RESOLVED_MODULE_ID } from './plugins/plugin-pages.js';
import { RESOLVED_SPLIT_MODULE_ID } from './plugins/plugin-ssr.js';
import { ASTRO_PAGE_EXTENSION_POST_PATTERN } from './plugins/util.js';
import type { PageBuildData, StaticBuildOptions } from './types.js';

/**
 * This pipeline is responsible to gather the files emitted by the SSR build and generate the pages by executing these files.
 */
export class BuildPipeline extends Pipeline {
	#internals: BuildInternals;
	#staticBuildOptions: StaticBuildOptions;
	#manifest: SSRManifest;

	constructor(
		staticBuildOptions: StaticBuildOptions,
		internals: BuildInternals,
		manifest: SSRManifest
	) {
		const ssr = isServerLikeOutput(staticBuildOptions.settings.config);
		const resolveCache = new Map<string, string>();
		super(
			createEnvironment({
				adapterName: manifest.adapterName,
				logger: staticBuildOptions.logger,
				mode: staticBuildOptions.mode,
				renderers: manifest.renderers,
				clientDirectives: manifest.clientDirectives,
				compressHTML: manifest.compressHTML,
				async resolve(specifier: string) {
					if (resolveCache.has(specifier)) {
						return resolveCache.get(specifier)!;
					}
					const hashedFilePath = manifest.entryModules[specifier];
					if (typeof hashedFilePath !== 'string' || hashedFilePath === '') {
						// If no "astro:scripts/before-hydration.js" script exists in the build,
						// then we can assume that no before-hydration scripts are needed.
						if (specifier === BEFORE_HYDRATION_SCRIPT_ID) {
							resolveCache.set(specifier, '');
							return '';
						}
						throw new Error(`Cannot find the built path for ${specifier}`);
					}
					const assetLink = createAssetLink(hashedFilePath, manifest.base, manifest.assetsPrefix);
					resolveCache.set(specifier, assetLink);
					return assetLink;
				},
				routeCache: staticBuildOptions.routeCache,
				site: manifest.site,
				ssr,
				streaming: true,
			})
		);
		this.#internals = internals;
		this.#staticBuildOptions = staticBuildOptions;
		this.#manifest = manifest;
		this.setEndpointHandler(this.#handleEndpointResult);
	}

	getInternals(): Readonly<BuildInternals> {
		return this.#internals;
	}

	getSettings(): Readonly<AstroSettings> {
		return this.#staticBuildOptions.settings;
	}

	getStaticBuildOptions(): Readonly<StaticBuildOptions> {
		return this.#staticBuildOptions;
	}

	getConfig(): AstroConfig {
		return this.#staticBuildOptions.settings.config;
	}

	getManifest(): SSRManifest {
		return this.#manifest;
	}

	getLogger(): Logger {
		return this.getEnvironment().logger;
	}

	/**
	 * The SSR build emits two important files:
	 * - dist/server/manifest.mjs
	 * - dist/renderers.mjs
	 *
	 * These two files, put together, will be used to generate the pages.
	 *
	 * ## Errors
	 *
	 * It will throw errors if the previous files can't be found in the file system.
	 *
	 * @param staticBuildOptions
	 */
	static async retrieveManifest(
		staticBuildOptions: StaticBuildOptions,
		internals: BuildInternals
	): Promise<SSRManifest> {
		const config = staticBuildOptions.settings.config;
		const baseDirectory = getOutputDirectory(config);
		const manifestEntryUrl = new URL(
			`${internals.manifestFileName}?time=${Date.now()}`,
			baseDirectory
		);
		const { manifest } = await import(manifestEntryUrl.toString());
		if (!manifest) {
			throw new Error(
				"Astro couldn't find the emitted manifest. This is an internal error, please file an issue."
			);
		}

		const renderersEntryUrl = new URL(`renderers.mjs?time=${Date.now()}`, baseDirectory);
		const renderers = await import(renderersEntryUrl.toString());
		if (!renderers) {
			throw new Error(
				"Astro couldn't find the emitted renderers. This is an internal error, please file an issue."
			);
		}
		return {
			...manifest,
			renderers: renderers.renderers as SSRLoadedRenderer[],
		};
	}

	/**
	 * It collects the routes to generate during the build.
	 *
	 * It returns a map of page information and their relative entry point as a string.
	 */
	retrieveRoutesToGenerate(): Map<PageBuildData, string> {
		const pages = new Map<PageBuildData, string>();

		for (const [entryPoint, filePath] of this.#internals.entrySpecifierToBundleMap) {
			// virtual pages can be emitted with different prefixes:
			// - the classic way are pages emitted with prefix ASTRO_PAGE_RESOLVED_MODULE_ID -> plugin-pages
			// - pages emitted using `build.split`, in this case pages are emitted with prefix RESOLVED_SPLIT_MODULE_ID
			if (
				entryPoint.includes(ASTRO_PAGE_RESOLVED_MODULE_ID) ||
				entryPoint.includes(RESOLVED_SPLIT_MODULE_ID)
			) {
				const [, pageName] = entryPoint.split(':');
				const pageData = this.#internals.pagesByComponent.get(
					`${pageName.replace(ASTRO_PAGE_EXTENSION_POST_PATTERN, '.')}`
				);
				if (!pageData) {
					throw new Error(
						"Build failed. Astro couldn't find the emitted page from " + pageName + ' pattern'
					);
				}

				pages.set(pageData, filePath);
			}
		}
		for (const [path, pageData] of this.#internals.pagesByComponent.entries()) {
			if (pageData.route.type === 'redirect') {
				pages.set(pageData, path);
			}
		}
		return pages;
	}

	async #handleEndpointResult(_: Request, response: Response): Promise<Response> {
		return response;
	}
}
