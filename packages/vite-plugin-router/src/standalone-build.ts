import { fileURLToPath } from 'node:url';
import { getAstroApi } from '@astrojs/vite-plugin-astro';
import {
	createKey,
	getEnvironmentKey,
	hasEnvironmentKey,
} from '@astrojs/runtime/_internal/core/encryption.js';
import type { BuildEnvironmentOptions, Environment, Plugin, ResolvedConfig } from 'vite';
import { getClientOutputDirectory } from './internal/core/build/common.js';
import { createBuildInternals } from './internal/core/build/internal.js';
import { collectPagesData } from './internal/core/build/page-data.js';
import { createBuildSteps, prepareBuild } from './internal/core/build/static-build.js';
import type { BuildHost, StaticBuildOptionsInput } from './internal/core/build/types.js';
import { createViteBuildConfig } from './internal/core/build/vite-build-config.js';
import type { AstroLogger } from './internal/core/logger/core.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from './environment-names.js';
import type { RouterRegistry } from './internal/registry.js';
import type { RoutesList } from './routing.js';
import type { ServerOutputOptions } from './internal/vite-plugin-server-output/index.js';

const PRERENDER_ENTRY = fileURLToPath(
	new URL('./internal/entrypoints/prerender.js', import.meta.url),
);
const SERVER_ENTRY = fileURLToPath(new URL('./entrypoints/server.js', import.meta.url));

const BUILD_ENVIRONMENTS = [
	ASTRO_VITE_ENVIRONMENT_NAMES.prerender,
	ASTRO_VITE_ENVIRONMENT_NAMES.ssr,
	ASTRO_VITE_ENVIRONMENT_NAMES.client,
] as const;

interface StandaloneBuildOptions {
	registry: RouterRegistry;
	logger: AstroLogger;
	routesList: RoutesList;
	getBuildOutput: () => 'static' | 'server';
	getServerOutput: () => ServerOutputOptions | undefined;
}

/**
 * The plugins that run a production build in a plain Vite project: `vite build` builds the
 * prerender, server and client environments and writes the static pages, like `astro build`.
 */
export function standaloneBuildPlugins({
	registry,
	logger,
	routesList,
	getBuildOutput,
	getServerOutput,
}: StandaloneBuildOptions): Plugin[] {
	let viteConfig: ResolvedConfig;
	const internals = createBuildInternals();
	// Filled in `buildApp`, once the route table and the config are known.
	const opts = {
		allPages: {},
		pageNames: [],
		routesList,
		logger,
		runtimeMode: 'production',
		force: false,
		host: createStandaloneBuildHost(() => viteConfig, getServerOutput),
	} as unknown as StaticBuildOptionsInput;
	const steps = createBuildSteps(opts, internals);

	return [
		{
			name: '@astrojs/vite-plugin-router:build',
			apply: 'build',
			config() {
				return {
					// Builds the environments with `buildApp` instead of a single client build. One resolved
					// config keeps one set of plugin instances, so every environment sees the same registry
					// and build state; otherwise Vite loads the config file again for each environment.
					builder: { sharedConfigBuild: true },
					environments: Object.fromEntries(BUILD_ENVIRONMENTS.map((name) => [name, {}])),
				};
			},
			configResolved(config) {
				viteConfig = config;
			},
			buildApp: {
				// Before `astro()`'s own `buildApp`, which builds every unbuilt server and client
				// environment for render-API projects, so the environments are built with this build's
				// config whatever the order of `plugins`.
				order: 'pre',
				async handler(builder) {
					const config = registry.config;
					opts.config = config;
					opts.buildOutput = getBuildOutput();
					opts.viteConfig = { build: { emptyOutDir: builder.config.build.emptyOutDir } };
					opts.origin = config.site ? new URL(config.site).origin : 'http://localhost';
					opts.key = hasEnvironmentKey() ? getEnvironmentKey() : createKey();
					opts.allPages = collectPagesData({
						buildOutput: opts.buildOutput,
						logger,
						manifest: routesList,
					}).allPages;
					prepareBuild(opts, internals);

					// The output directories depend on whether a route renders on demand, which is only
					// known once the route table is created, after the environments were configured.
					const buildConfig = createViteBuildConfig({
						options: opts,
						viteConfig: {},
						routes: Object.values(opts.allPages).map((pageData) => pageData.route),
						plugins: [],
						builder: {},
						isRolldownInput: steps.isRolldownInput,
					});
					for (const name of BUILD_ENVIRONMENTS) {
						applyBuildConfig(builder.environments[name], buildConfig.build ?? {}, {
							...buildConfig.environments?.[name]?.build,
						});
					}
					const ssrBuild = builder.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr].config.build;
					if (opts.buildOutput === 'server' && !ssrBuild.rolldownOptions.input) {
						ssrBuild.rolldownOptions.input = { index: SERVER_ENTRY };
					}
					steps.setRolldownInput(ssrBuild.rolldownOptions.input);

					await steps.buildApp(builder);
				},
			},
		},
		...[...steps.buildPlugins, ...steps.postPlugins].map(
			(plugin): Plugin => ({ ...plugin, apply: 'build' }),
		),
		{
			name: '@astrojs/vite-plugin-router:build-done',
			apply: 'build',
			enforce: 'post',
			buildApp: {
				order: 'post',
				async handler() {
					await registry.buildDone({
						dir: getClientOutputDirectory(opts),
						routes: Object.values(opts.allPages).map((pageData) => pageData.route),
						pages: opts.pageNames.map((pathname) => ({ pathname })),
					});
				},
			},
		},
	];
}

/** Merges the build options of the top level and of one environment into its resolved config. */
function applyBuildConfig(
	environment: Environment,
	shared: BuildEnvironmentOptions,
	own: BuildEnvironmentOptions,
): void {
	const target = environment.config.build;
	const { rolldownOptions: sharedRolldown, ...sharedRest } = shared;
	const { rolldownOptions: ownRolldown, ...ownRest } = own;
	Object.assign(target, sharedRest, ownRest);
	target.rolldownOptions = {
		...target.rolldownOptions,
		...sharedRolldown,
		...ownRolldown,
		output: {
			...target.rolldownOptions.output,
			...sharedRolldown?.output,
			...ownRolldown?.output,
		},
	};
}

function createStandaloneBuildHost(
	getViteConfig: () => ResolvedConfig,
	getServerOutput: () => ServerOutputOptions | undefined,
): BuildHost {
	return {
		adapter: undefined,
		get renderers() {
			return getAstroApi(getViteConfig()).renderers;
		},
		prerenderer: undefined,
		prerenderEntry: PRERENDER_ENTRY,
		serverEntry: undefined,
		headInlineScripts: [],
		parallelPrerender: false,
		redirectPage: false,
		environments: {},
		prerenderConflictBehavior: 'warn',
		timer: { start() {}, end() {} },
		validatePrerenderedRoute() {},
		plugins: () => [],
		setupViteConfig: async (config) => config,
		chunkPostHooks: [],
		async manifestFields() {
			const headers = getServerOutput()?.internalFetchHeaders;
			const internalFetchHeaders = typeof headers === 'function' ? headers() : headers;
			return {
				middlewareMode: 'classic',
				clientDirectives: [],
				userAssetsBase: undefined,
				csp: undefined,
				internalFetchHeaders:
					internalFetchHeaders && Object.keys(internalFetchHeaders).length > 0
						? internalFetchHeaders
						: undefined,
				logLevel: 'info',
				shouldInjectCspMetaTags: false,
			};
		},
		async onServerManifest() {},
		async onGenerated() {},
		loadIncrementalCache: async () => null,
	};
}
