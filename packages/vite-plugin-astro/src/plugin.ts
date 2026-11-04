import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin, ResolvedConfig } from 'vite';
import type * as z from 'zod/v4';
import type { AstroPluginCli } from './internal/cli.js';
import { type AstroPluginOptions, AstroPluginOptionsSchema } from './options.js';
import type { AstroRenderer, ClientDirectiveConfig } from '@astrojs/runtime/types';
import compilePlugins from './internal/vite-plugin-astro/index.js';
import fileUrlPlugin from './vite-plugin-fileurl/index.js';
import headPlugin from './internal/vite-plugin-head/index.js';
import hmrReloadPlugin from './internal/vite-plugin-hmr-reload/index.js';
import renderersPlugin from './internal/vite-plugin-renderers/index.js';
import scriptsPlugin from './internal/vite-plugin-scripts/index.js';

/**
 * Project configuration owned by `astro()` and shared with every plugin built on it.
 */
export interface ResolvedSharedConfig {
	/** Absolute project root, with a trailing slash. */
	root: URL;
	/** Absolute source directory, with a trailing slash. */
	srcDir: URL;
	/** Absolute public directory, with a trailing slash. */
	publicDir: URL;
	/** Vite's resolved `base`. */
	base: string;
	site: string | undefined;
	compressHTML: boolean | 'jsx';
	trailingSlash: 'always' | 'never' | 'ignore';
}

/**
 * The API exposed by `astro()` as `plugin.api.astro`. Read it with `getAstroApi()`.
 */
export interface AstroPluginApi {
	/**
	 * The resolved shared configuration.
	 *
	 * `astro()` resolves it in a `configResolved` hook with `order: 'pre'`, so it is available in
	 * every other plugin's `configResolved` hook (without `order: 'pre'`) and later.
	 *
	 * @throws {Error} When read before it has been resolved.
	 */
	readonly config: ResolvedSharedConfig;
	/** Renderers passed in `AstroPluginOptions.renderers`. */
	readonly renderers: readonly AstroRenderer[];
	/** Custom directives passed in `AstroPluginOptions.clientDirectives`. */
	readonly clientDirectives: readonly ClientDirectiveConfig[];
}

const PLUGIN_NAME = '@astrojs/vite-plugin-astro';
const RUNTIME_NAME = '@astrojs/runtime';

/**
 * Compiles `.astro` components and serves the renderers of the `astro` CLI.
 *
 * @param cli What the `astro` CLI passes besides the options.
 */
export default function astro(options: AstroPluginOptions, cli: AstroPluginCli): Plugin[] {
	const parsed = AstroPluginOptionsSchema.parse(
		options satisfies z.input<typeof AstroPluginOptionsSchema>,
	);
	let config: ResolvedSharedConfig | undefined;
	// The objects passed in, not the parsed copies: renderers of integrations may carry more fields,
	// which reach the renderers module.
	const renderers = options.renderers ?? [];

	const api: AstroPluginApi = {
		get config() {
			if (!config) {
				throw new Error(
					`The ${PLUGIN_NAME} config was read before Vite resolved its config. Read \`api.astro.config\` in a \`configResolved\` hook or later.`,
				);
			}
			return config;
		},
		renderers,
		clientDirectives: parsed.clientDirectives,
	};

	const plugins: Plugin[] = [
		{
			name: PLUGIN_NAME,
			api: { astro: api },
			configResolved: {
				order: 'pre',
				handler(viteConfig) {
					config = resolveSharedConfig(parsed, viteConfig);
				},
			},
			configEnvironment(name, environmentOptions) {
				const consumer = environmentOptions.consumer ?? (name === 'client' ? 'client' : 'server');
				if (consumer !== 'server') return;
				// Vite processes the runtime rather than externalizing it, as it does `astro`, so that
				// compiled components and the code that renders them share one copy of it.
				return { resolve: { noExternal: [PLUGIN_NAME, RUNTIME_NAME] } };
			},
		},
		...compilePlugins({
			config: cli.compileConfig,
			logger: cli.logger,
			toolbarEnabled: cli.toolbarEnabled,
			internalURL: cli.internalURL,
			transitionsAnimationURL: cli.transitionsAnimationURL,
		}),
		renderersPlugin({ renderers, skipRenderers: cli.skipRenderers }),
		scriptsPlugin({ scripts: cli.scripts ?? [] }),
		headPlugin({ environments: cli.headEnvironments }),
		fileUrlPlugin(),
		hmrReloadPlugin({ getDevCssModuleId: cli.getDevCssModuleId }),
	];
	return plugins;
}

/**
 * Returns the API of the `astro()` plugin registered in `config`.
 *
 * @throws {Error} When `astro()` is not in Vite's `plugins`.
 */
export function getAstroApi(config: ResolvedConfig): AstroPluginApi {
	const api = config.plugins.find((plugin) => plugin.name === PLUGIN_NAME)?.api?.astro;
	if (!api) {
		throw new Error(
			`\`astro()\` from ${PLUGIN_NAME} is missing from the Vite \`plugins\` array. Plugins that read \`api.astro\` require it.`,
		);
	}
	return api;
}

function resolveSharedConfig(
	options: z.output<typeof AstroPluginOptionsSchema>,
	viteConfig: ResolvedConfig,
): ResolvedSharedConfig {
	const root = path.resolve(viteConfig.root, options.root ?? '.');
	return {
		root: resolveDirAsUrl(root, '.'),
		srcDir: resolveDirAsUrl(root, options.srcDir),
		publicDir: resolveDirAsUrl(root, options.publicDir),
		base: viteConfig.base,
		site: options.site,
		compressHTML: options.compressHTML,
		trailingSlash: options.trailingSlash,
	};
}

function resolveDirAsUrl(root: string, dir: string): URL {
	let resolvedDir = path.resolve(root, dir);
	if (!resolvedDir.endsWith(path.sep)) {
		resolvedDir += path.sep;
	}
	return pathToFileURL(resolvedDir);
}
