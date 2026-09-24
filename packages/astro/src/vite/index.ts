import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import { createSettings } from '../core/config/settings.js';
import { validateConfig } from '../core/config/validate.js';
import { createVite } from '../core/create-vite.js';
import { createKey, getEnvironmentKey, hasEnvironmentKey } from '../core/encryption.js';
import { emptyDir } from '../core/fs/index.js';
import { createNodeLoggerFromFlags } from '../core/logger/impls/node.js';
import { collectPagesData } from '../core/build/page-data.js';
import {
	createBuildEnvironmentsConfig,
	createTrackedBuildInternals,
} from '../core/build/static-build.js';
import type { StaticBuildOptions } from '../core/build/types.js';
import { createRoutesList } from '../core/routing/create-manifest.js';
import { vitePluginAstroPreview } from '../core/preview/vite-plugin-astro-preview.js';
import { getClientOutputDirectory, getPrerenderDefault } from '../prerender/utils.js';
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
 * Astro as a Vite plugin. Returns a promise so that settings and the route list
 * are resolved before Vite flattens the plugin array.
 *
 * Plugins that capture `command` at construction are created once per command and
 * gated with `apply`, since the command is not known when `vite.config` is evaluated.
 */
export async function astro(options: AstroVitePluginOptions = {}): Promise<vite.PluginOption[]> {
	const { renderers = [], ...userConfig } = options;
	const [devPlugins, buildPlugins] = await Promise.all([
		createPluginSet('dev', userConfig, renderers),
		createPluginSet('build', userConfig, renderers),
	]);
	return [...renderers.map((r) => r.plugins ?? []), ...devPlugins, ...buildPlugins];
}

async function createPluginSet(
	command: Command,
	userConfig: Omit<AstroVitePluginOptions, 'renderers'>,
	renderers: AstroViteRenderer[],
): Promise<vite.Plugin[]> {
	const root = userConfig.root ? path.resolve(String(userConfig.root)) : process.cwd();
	const mode = command === 'dev' ? 'development' : 'production';
	const logger = createNodeLoggerFromFlags({});
	const config = await validateConfig({ ...userConfig }, root, command);
	const settings = await createSettings(config, undefined, root);

	for (const { renderer, scripts = [] } of renderers) {
		settings.renderers.push(renderer);
		for (const script of scripts) {
			if (!script.command || script.command === command) {
				settings.scripts.push({ stage: script.stage, content: script.content });
			}
		}
	}
	settings.buildOutput = getPrerenderDefault(settings.config) ? 'static' : 'server';

	const routesList = await createRoutesList({ settings }, logger, { dev: command === 'dev' });

	const {
		plugins: corePlugins = [],
		// Owned by the user's Vite config in plugin mode.
		configFile: _configFile,
		customLogger: _customLogger,
		clearScreen: _clearScreen,
		...baseConfig
	} = await createVite({}, { settings, logger, mode, command, sync: false, routesList });

	let plugins: vite.PluginOption[];
	let viteConfig: vite.UserConfig;

	if (command === 'build') {
		const { allPages } = collectPagesData({ settings, logger, manifest: routesList });
		const opts: StaticBuildOptions = {
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
		const internals = createTrackedBuildInternals(opts);
		const { plugins: allPlugins = [], ...buildConfig } = createBuildEnvironmentsConfig(
			opts,
			internals,
		);
		plugins = [
			...allPlugins,
			{
				name: 'astro:vite:empty-out-dir',
				buildApp: {
					order: 'pre',
					async handler() {
						emptyDir(settings.config.outDir, new Set(['.git']));
					},
				},
			},
		];
		viteConfig = buildConfig;
	} else {
		plugins = [...corePlugins, vitePluginAstroPreview(settings)];
		viteConfig = baseConfig;
	}

	// `vite preview` runs as `serve` and serves the static build output.
	const previewConfig: vite.UserConfig = {
		base: settings.config.base,
		appType: 'mpa',
		build: { outDir: fileURLToPath(getClientOutputDirectory(settings)) },
	};

	return gate(
		[
			{
				name: `astro:vite:config:${command}`,
				config(_config, env) {
					return env.isPreview ? previewConfig : viteConfig;
				},
			},
			...plugins,
		],
		command,
	);
}

/**
 * Flattens the plugin list and restricts every plugin to the given command.
 *
 * Build plugins are marked `sharedDuringBuild`: Vite's builder re-resolves the config
 * per environment, which re-evaluates `vite.config` and would otherwise give each
 * environment fresh plugin instances with separate build state.
 */
function gate(options: vite.PluginOption[], command: Command): vite.Plugin[] {
	const target = command === 'dev' ? 'serve' : 'build';
	const result: vite.Plugin[] = [];
	for (const plugin of (options as any[]).flat(Number.POSITIVE_INFINITY) as vite.Plugin[]) {
		if (!plugin) continue;
		const { apply } = plugin;
		if (typeof apply === 'string') {
			if (apply !== target) continue;
		} else if (typeof apply === 'function') {
			plugin.apply = (config, env) => env.command === target && apply(config, env);
		} else {
			plugin.apply = target;
		}
		if (command === 'build') {
			plugin.sharedDuringBuild = true;
		}
		result.push(plugin);
	}
	return result;
}
