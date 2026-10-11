import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin, ResolvedConfig } from 'vite';
import type * as z from 'zod/v4';
import { type AstroPluginOptions, AstroPluginOptionsSchema } from './options.js';
import type { AstroRenderer, ClientDirectiveConfig } from './types.js';
import compilePlugins, { type AstroCompileConfig } from './vite-plugin-astro/index.js';
import clientDirectivesPlugin from './vite-plugin-client-directives/index.js';
import componentAssetsPlugin from './vite-plugin-component-assets/index.js';
import fileUrlPlugin from './vite-plugin-fileurl/index.js';
import headPlugin from './vite-plugin-head/index.js';
import hmrReloadPlugin from './vite-plugin-hmr-reload/index.js';
import renderersPlugin from './vite-plugin-renderers/index.js';

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

/**
 * Compiles `.astro` components and serves what `@astrojs/vite-plugin-astro/render` needs to render
 * them: renderers, client directives, and each component tree's stylesheets and island URLs.
 */
export default function astro(options: AstroPluginOptions = {}): Plugin[] {
	const parsed = AstroPluginOptionsSchema.parse(
		options satisfies z.input<typeof AstroPluginOptionsSchema>,
	);
	let config: ResolvedSharedConfig | undefined;
	// Filled in once Vite's config is resolved; the compiler reads it on use.
	const compileConfig = {} as AstroCompileConfig;

	const api: AstroPluginApi = {
		get config() {
			if (!config) {
				throw new Error(
					`The ${PLUGIN_NAME} config was read before Vite resolved its config. Read \`api.astro.config\` in a \`configResolved\` hook or later.`,
				);
			}
			return config;
		},
		renderers: parsed.renderers,
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
					Object.assign(compileConfig, {
						root: config.root,
						srcDir: config.srcDir,
						publicDir: config.publicDir,
						base: config.base,
						site: config.site,
						compressHTML: config.compressHTML,
						trailingSlash: config.trailingSlash,
						scopedStyleStrategy: 'attribute',
						devToolbar: { enabled: false },
						build: { format: 'directory' },
					} satisfies AstroCompileConfig);
				},
			},
			configEnvironment(name, environmentOptions) {
				const consumer = environmentOptions.consumer ?? (name === 'client' ? 'client' : 'server');
				if (consumer !== 'server') return;
				// The render API imports virtual modules, so Vite must process the package rather than
				// externalize it. This also keeps one copy of the runtime for compiled components.
				return { resolve: { noExternal: [PLUGIN_NAME] } };
			},
		},
		...compilePlugins({
			config: compileConfig,
			// Vite's logger has no debug level.
			logger: { debug() {} },
			toolbarEnabled: () => false,
		}),
		renderersPlugin({ renderers: parsed.renderers }),
		clientDirectivesPlugin({
			clientDirectives: parsed.clientDirectives,
			getRoot: () => api.config.root,
		}),
		componentAssetsPlugin({
			renderers: parsed.renderers,
			getRenderConfig: () => ({ compressHTML: api.config.compressHTML, site: api.config.site }),
		}),
		headPlugin(),
		fileUrlPlugin(),
		hmrReloadPlugin(),
	];
	// Vite resolves the config again for each build environment, which re-runs a config file and
	// creates new plugin instances. The client build reads state collected by the server build
	// (compile metadata, component assets), so every environment must use the same instances.
	for (const plugin of plugins) {
		plugin.sharedDuringBuild = true;
	}
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
			`\`astro()\` from ${PLUGIN_NAME} is missing from the Vite \`plugins\` array. Plugins built on Astro, such as \`pages()\`, require it.`,
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
