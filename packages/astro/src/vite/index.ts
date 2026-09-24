import nodeFs from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import { setupDevContent } from '../content/dev-setup.js';
import { collectPagesData } from '../core/build/page-data.js';
import {
	createBuildEnvironmentsConfig,
	createTrackedBuildInternals,
} from '../core/build/static-build.js';
import type { StaticBuildOptions } from '../core/build/types.js';
import { createSettings } from '../core/config/settings.js';
import { validateConfig } from '../core/config/validate.js';
import { createVite } from '../core/create-vite.js';
import { warnMissingAdapter } from '../core/dev/adapter-validation.js';
import { createKey, getEnvironmentKey, hasEnvironmentKey } from '../core/encryption.js';
import { AstroError, AstroErrorData } from '../core/errors/index.js';
import { emptyDir } from '../core/fs/index.js';
import { createNodeLoggerFromFlags } from '../core/logger/impls/node.js';
import { vitePluginAstroPreview } from '../core/preview/vite-plugin-astro-preview.js';
import { createRoutesList } from '../core/routing/create-manifest.js';
import { syncInternal } from '../core/sync/index.js';
import {
	runHookBuildDone,
	runHookBuildSetup,
	runHookBuildStart,
	runHookConfigDone,
	runHookConfigSetup,
	runHookServerDone,
	runHookServerStart,
} from '../integrations/hooks.js';
import { getClientOutputDirectory, getPrerenderDefault } from '../prerender/utils.js';
import type { AstroUserConfig } from '../types/public/config.js';

type Command = 'dev' | 'build';

export interface AstroViteEnv {
	command: vite.ConfigEnv['command'];
	mode?: string;
}

// Vite re-evaluates `vite.config` on dev server restarts; integrations receive `isRestart`.
const startedRoots: Set<string> = ((globalThis as any).__astroViteStartedRoots ??= new Set());

// Vite's builder re-evaluates `vite.config` once per environment, all before `buildApp` runs.
// Reusing the first result keeps integration hooks from re-running and gives every
// environment the same plugin instances, as the CLI's inline config does. Cleared when
// `buildApp` starts so later builds in the same process start fresh.
const buildSetups: Map<string, Promise<vite.PluginOption[]>> = ((
	globalThis as any
).__astroViteBuildSetups ??= new Map());

/**
 * Astro as a Vite plugin. Takes an Astro config inline (no `astro.config.*` is loaded) and
 * runs the integration pipeline before Vite flattens the plugin array, so Vite plugins
 * added by integrations are returned alongside Astro's own.
 *
 * Integrations need the command during `astro:config:setup`, before Vite exposes it to
 * plugins. It is inferred from `NODE_ENV`, which Vite sets before loading `vite.config`,
 * and checked against Vite's real command in the `config` hook. Pass `env` to set it
 * explicitly, e.g. `defineConfig((env) => ({ plugins: [astro(config, env)] }))`.
 */
export function astro(
	userConfig: AstroUserConfig = {},
	env?: AstroViteEnv,
): Promise<vite.PluginOption[]> {
	const command: Command = env
		? env.command === 'build'
			? 'build'
			: 'dev'
		: process.env.NODE_ENV === 'production'
			? 'build'
			: 'dev';
	const root = userConfig.root ? path.resolve(String(userConfig.root)) : process.cwd();
	if (command === 'dev') return setup(userConfig, command, root, env?.mode);

	let result = buildSetups.get(root);
	if (!result) {
		result = setup(userConfig, command, root, env?.mode);
		result.catch(() => buildSetups.delete(root));
		buildSetups.set(root, result);
	}
	return result;
}

async function setup(
	userConfig: AstroUserConfig,
	command: Command,
	root: string,
	envMode: string | undefined,
): Promise<vite.PluginOption[]> {
	let mode = envMode ?? (command === 'build' ? 'production' : 'development');
	const isRestart = startedRoots.has(root);
	startedRoots.add(root);

	const logger = createNodeLoggerFromFlags({});
	const config = await validateConfig({ ...userConfig }, root, command);
	let settings = await createSettings(config, undefined, root);
	settings = await runHookConfigSetup({ settings, command, logger, isRestart });
	settings.buildOutput = getPrerenderDefault(settings.config) ? 'static' : 'server';
	const routesList = await createRoutesList({ settings }, logger, { dev: command === 'dev' });
	await runHookConfigDone({ settings, logger, command });

	if (command === 'dev') {
		warnMissingAdapter(logger, settings);
	} else if (!settings.config.adapter && settings.buildOutput === 'server') {
		throw new AstroError(AstroErrorData.NoAdapterInstalled);
	}

	const {
		plugins: corePlugins = [],
		// Owned by the user's Vite config in plugin mode.
		configFile: _configFile,
		customLogger: _customLogger,
		clearScreen: _clearScreen,
		mode: _mode,
		...baseConfig
	} = await createVite(
		{},
		{ settings, logger, mode: () => mode, command, sync: false, routesList },
	);

	let plugins: vite.PluginOption[] = corePlugins;
	let viteConfig: vite.UserConfig = baseConfig;
	const pageNames: string[] = [];

	if (command === 'build') {
		await runHookBuildStart({ settings, logger });
		const { allPages } = collectPagesData({ settings, logger, manifest: routesList });
		const buildOptions: StaticBuildOptions = {
			allPages,
			settings,
			logger,
			routesList,
			runtimeMode: 'production',
			origin: settings.config.site
				? new URL(settings.config.site).origin
				: `http://localhost:${settings.config.server.port}`,
			pageNames,
			viteConfig: { ...baseConfig, plugins: corePlugins },
			key: hasEnvironmentKey() ? getEnvironmentKey() : createKey(),
			force: false,
		};
		const internals = createTrackedBuildInternals(buildOptions);
		// Runs before Vite flattens plugins, so plugins added by `astro:build:setup` are kept.
		const { plugins: buildPlugins = [], ...buildConfig } = await runHookBuildSetup({
			config: settings.config,
			pages: internals.pagesByKeys,
			vite: createBuildEnvironmentsConfig(buildOptions, internals),
			target: 'server',
			logger,
		});
		plugins = [
			buildPlugins,
			{
				name: 'astro:vite:build-setup',
				buildApp: {
					order: 'pre',
					async handler() {
						buildSetups.delete(root);
						// Content layer sync and type generation, as `astro build` runs before building.
						await syncInternal({ mode, settings, logger, fs: nodeFs, command: 'build' });
						emptyDir(settings.config.outDir, new Set(['.git']));
					},
				},
			},
			{
				// After `astro:build-generate`, which is also a post `buildApp` hook.
				name: 'astro:vite:build-done',
				enforce: 'post',
				buildApp: {
					order: 'post',
					async handler() {
						await runHookBuildDone({
							settings,
							pages: pageNames,
							routes: Object.values(allPages).map((pageData) => pageData.route),
							logger,
						});
					},
				},
			},
		];
		viteConfig = buildConfig;
	}

	// `vite preview` serves the static build output.
	const previewConfig: vite.UserConfig = {
		base: settings.config.base,
		appType: 'mpa',
		build: { outDir: fileURLToPath(getClientOutputDirectory(settings)) },
	};

	return [
		{
			name: 'astro:vite:config',
			enforce: 'pre',
			config(_config, viteEnv) {
				if (viteEnv.isPreview) return previewConfig;
				const actual: Command = viteEnv.command === 'build' ? 'build' : 'dev';
				if (actual !== command) {
					throw new Error(
						`astro() set up integrations for "${command}" (inferred from NODE_ENV=${process.env.NODE_ENV}), ` +
							`but Vite is running "${viteEnv.command}". Pass the command explicitly: ` +
							`defineConfig((env) => ({ plugins: [astro(config, env)] })).`,
					);
				}
				mode = viteEnv.mode;
				return viteConfig;
			},
			async configureServer(server) {
				// Blocks server startup until content is synced, as `astro dev` does.
				await syncInternal({
					mode,
					settings,
					logger,
					fs: nodeFs,
					skip: { content: true, cleanup: true },
					command: 'dev',
					watcher: server.watcher,
				});
				await setupDevContent({ settings, logger, fs: nodeFs, viteServer: server });
				server.httpServer?.once('listening', () => {
					runHookServerStart({
						config: settings.config,
						address: server.httpServer!.address() as AddressInfo,
						logger,
					});
				});
				server.httpServer?.once('close', () => {
					runHookServerDone({ config: settings.config, logger });
				});
			},
		},
		...plugins,
		vitePluginAstroPreview(settings),
	];
}
