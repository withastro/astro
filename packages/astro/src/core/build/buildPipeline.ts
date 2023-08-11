import { Pipeline } from '../pipeline.js';
import type { BuildInternals } from './internal';
import type { PageBuildData, StaticBuildOptions } from './types';
import { ASTRO_PAGE_RESOLVED_MODULE_ID } from './plugins/plugin-pages.js';
import { RESOLVED_SPLIT_MODULE_ID } from './plugins/plugin-ssr.js';
import { ASTRO_PAGE_EXTENSION_POST_PATTERN } from './plugins/util.js';
import type { SSRManifest } from '../app/types';
import type { AstroConfig, AstroSettings, SSRLoadedRenderer } from '../../@types/astro';
import { isServerLikeOutput } from '../../prerender/utils.js';
import type { EndpointCallResult } from '../endpoint';
import { createEnvironment } from '../render/index.js';
import { BEFORE_HYDRATION_SCRIPT_ID } from '../../vite-plugin-scripts/index.js';
import { createAssetLink } from '../render/ssr-element.js';

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
		super(
			createEnvironment({
				adapterName: manifest.adapterName,
				logging: staticBuildOptions.logging,
				mode: staticBuildOptions.mode,
				renderers: manifest.renderers,
				clientDirectives: manifest.clientDirectives,
				compressHTML: manifest.compressHTML,
				async resolve(specifier: string) {
					const hashedFilePath = manifest.entryModules[specifier];
					if (typeof hashedFilePath !== 'string') {
						// If no "astro:scripts/before-hydration.js" script exists in the build,
						// then we can assume that no before-hydration scripts are needed.
						if (specifier === BEFORE_HYDRATION_SCRIPT_ID) {
							return '';
						}
						throw new Error(`Cannot find the built path for ${specifier}`);
					}
					return createAssetLink(hashedFilePath, manifest.base, manifest.assetsPrefix);
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

	static async retrieveManifest(staticBuildOptions: StaticBuildOptions): Promise<SSRManifest> {
		const manifestEntryUrl = new URL(
			'manifest.mjs',
			staticBuildOptions.settings.config.build.server
		);
		const manifest: SSRManifest | undefined = await import(manifestEntryUrl.toString());
		if (!manifest) {
			throw new Error(
				"Astro couldn't find the emitted manifest. This is an internal error, please file an issue."
			);
		}

		const renderersEntryUrl = new URL('renderers.mjs', staticBuildOptions.settings.config.outDir);
		const renderers: SSRLoadedRenderer[] | undefined = await import(renderersEntryUrl.toString());
		if (!renderers) {
			throw new Error(
				"Astro couldn't find the emitted renderers. This is an internal error, please file an issue."
			);
		}
		manifest.renderers = renderers;
		return manifest;
	}

	retrievePagesToGenerate(): Map<PageBuildData, string> {
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

	async #handleEndpointResult(_: Request, response: EndpointCallResult): Promise<Response> {
		if (response.type === 'response') {
			// NOTE: is an empty body allowed??
			// If there's no body, do nothing
			// if (!response.response.body) return;
			const ab = await response.response.arrayBuffer();
			const body = new Uint8Array(ab);
			// TODO handle headers for encoding
			return new Response(body, {
				headers: { ...response.response.headers },
			});
		} else {
			// TODO: handle encoding
			return new Response(response.body, {});
		}
	}

	getManifest(): SSRManifest {
		return this.#manifest;
	}
}
