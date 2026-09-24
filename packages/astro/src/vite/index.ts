import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import { createBuildInternals } from '../core/build/internal.js';
import { collectPagesData } from '../core/build/page-data.js';
import {
	createBuildEnvironmentsConfig,
	createTrackedBuildInternals,
} from '../core/build/static-build.js';
import type { AllPagesData, StaticBuildOptions } from '../core/build/types.js';
import { createSettings } from '../core/config/settings.js';
import { validateConfig } from '../core/config/validate.js';
import { createVite } from '../core/create-vite.js';
import { createKey, getEnvironmentKey, hasEnvironmentKey } from '../core/encryption.js';
import { emptyDir } from '../core/fs/index.js';
import { createNodeLoggerFromFlags } from '../core/logger/impls/node.js';
import { vitePluginAstroPreview } from '../core/preview/vite-plugin-astro-preview.js';
import { createRoutesList } from '../core/routing/create-manifest.js';
import { getClientOutputDirectory, getPrerenderDefault } from '../prerender/utils.js';
import type { RoutesList } from '../types/astro.js';
import type { AstroUserConfig } from '../types/public/config.js';
import type { AstroRenderer, InjectedScriptStage } from '../types/public/integrations.js';

type Command = 'dev' | 'build';

/** A UI framework renderer, plus the Vite plugins and scripts it needs. */
export interface AstroViteRenderer {
	renderer: AstroRenderer;
	plugins?: vite.PluginOption[];
	scripts?: Array<{ stage: InjectedScriptStage; content: string; command?: Command }>;
}

export interface AstroVitePluginOptions
	extends Omit<AstroUserConfig, 'integrations' | 'adapter' | 'vite'> {
	renderers?: AstroViteRenderer[];
}

/**
 * Astro as a Vite plugin. Returns a promise so that settings are resolved before Vite
 * flattens the plugin array.
 *
 * The command and mode are not known until Vite runs `config` hooks, so everything that
 * depends on them (the route list, injected scripts, build page data) is filled in there.
 */
export async function astro(options: AstroVitePluginOptions = {}): Promise<vite.PluginOption[]> {
	const { renderers = [], ...userConfig } = options;
	const root = userConfig.root ? path.resolve(String(userConfig.root)) : process.cwd();
	const logger = createNodeLoggerFromFlags({});
	const config = await validateConfig({ ...userConfig }, root, 'dev');
	const settings = await createSettings(config, undefined, root);
	settings.renderers.push(...renderers.map((r) => r.renderer));
	settings.buildOutput = getPrerenderDefault(settings.config) ? 'static' : 'server';

	// Plugins capture these objects at construction; the `config` hook fills them in.
	const routesList: RoutesList = { routes: [] };
	const allPages: AllPagesData = {};
	const internals = createBuildInternals();
	let mode = 'development';

	const {
		plugins: corePlugins = [],
		// Owned by the user's Vite config in plugin mode.
		configFile: _configFile,
		customLogger: _customLogger,
		clearScreen: _clearScreen,
		mode: _mode,
		...baseConfig
	} = await createVite({}, { settings, logger, mode: () => mode, sync: false, routesList });

	const buildOptions: StaticBuildOptions = {
		allPages,
		settings,
		logger,
		routesList,
		runtimeMode: 'production',
		origin: settings.config.site
			? new URL(settings.config.site).origin
			: `http://localhost:${settings.config.server.port}`,
		pageNames: [],
		viteConfig: { ...baseConfig, plugins: corePlugins },
		key: hasEnvironmentKey() ? getEnvironmentKey() : createKey(),
		force: false,
	};
	const { plugins: allPlugins = [], ...buildConfig } = createBuildEnvironmentsConfig(
		buildOptions,
		internals,
	);

	// `vite preview` runs as `serve` and serves the static build output.
	const previewConfig: vite.UserConfig = {
		base: settings.config.base,
		appType: 'mpa',
		build: { outDir: fileURLToPath(getClientOutputDirectory(settings)) },
	};

	let configured = false;
	const configPlugin: vite.Plugin = {
		name: 'astro:vite:config',
		enforce: 'pre',
		async config(_config, env) {
			if (env.isPreview) return previewConfig;
			const command: Command = env.command === 'build' ? 'build' : 'dev';

			// Vite's builder re-runs `config` hooks per environment; the setup below runs once.
			if (!configured) {
				configured = true;
				mode = env.mode;
				for (const { scripts = [] } of renderers) {
					for (const script of scripts) {
						if (!script.command || script.command === command) {
							settings.scripts.push({ stage: script.stage, content: script.content });
						}
					}
				}
				const list = await createRoutesList({ settings }, logger, { dev: command === 'dev' });
				routesList.routes.push(...list.routes);
				if (command === 'build') {
					Object.assign(
						allPages,
						collectPagesData({ settings, logger, manifest: routesList }).allPages,
					);
					createTrackedBuildInternals(buildOptions, internals);
				}
			}
			return command === 'build' ? buildConfig : baseConfig;
		},
	};

	const plugins = (allPlugins as any[])
		.flat(Number.POSITIVE_INFINITY)
		.filter(Boolean) as vite.Plugin[];
	const coreSet = new Set((corePlugins as any[]).flat(Number.POSITIVE_INFINITY));
	for (const plugin of plugins) {
		// Build pipeline plugins, which the CLI only adds during `astro build`.
		if (!coreSet.has(plugin) && !plugin.apply) plugin.apply = 'build';
		// Vite's builder re-resolves the config per environment, which re-evaluates
		// `vite.config` and would otherwise give each environment fresh plugin instances
		// with separate build state.
		plugin.sharedDuringBuild = true;
	}

	return [
		...renderers.map((r) => r.plugins ?? []),
		configPlugin,
		...plugins,
		{
			name: 'astro:vite:empty-out-dir',
			apply: 'build',
			buildApp: {
				order: 'pre',
				async handler() {
					emptyDir(settings.config.outDir, new Set(['.git']));
				},
			},
		},
		vitePluginAstroPreview(settings),
	];
}
