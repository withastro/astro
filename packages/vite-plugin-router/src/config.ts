import type { OutgoingHttpHeaders } from 'node:http';
import type { ResolvedSharedConfig } from '@astrojs/vite-plugin-astro';
import type { AssetsPrefix } from './internal/core/app/types.js';
import type { ResolvedRouterPluginOptions } from './options.js';

/**
 * The project configuration the routing layer reads: `astro()`'s shared config, the resolved
 * `router()` options and the directories and dev server options that come from Vite.
 *
 * `router()` resolves it from those three sources; the `astro` CLI resolves it from its config.
 * Read it with `getRouterRegistry(config).config`.
 */
export interface RouterConfig
	extends ResolvedSharedConfig,
		Omit<ResolvedRouterPluginOptions, 'srcDir' | 'build'> {
	/** Absolute source directory (`srcDir`), with a trailing slash. */
	srcDir: URL;
	build: Omit<ResolvedRouterPluginOptions['build'], 'client' | 'server'> & {
		/** Absolute client output directory of `output: 'server'`, with a trailing slash. */
		client: URL;
		/** Absolute server output directory of `output: 'server'`, with a trailing slash. */
		server: URL;
		/** Prefix of the URLs of built assets. */
		assetsPrefix: AssetsPrefix | undefined;
	};
	/** Absolute output directory, with a trailing slash. */
	outDir: URL;
	/** Absolute cache directory, with a trailing slash. */
	cacheDir: URL;
	/** Extensions of the files in `src/pages/` that become pages, besides `.astro` and `.html`. */
	pageExtensions: readonly string[];
	/** Headers added to every dev server response. */
	serverHeaders: OutgoingHttpHeaders | undefined;
}
