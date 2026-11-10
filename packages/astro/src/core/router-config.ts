import type { RouterConfig, ServerOutputOptions } from '@astrojs/vite-plugin-router';
import type { AstroSettings } from '../types/astro.js';

/** The `serverOutput` option the adapter of an Astro project implies. */
export function toServerOutputOptions({ adapter }: AstroSettings): ServerOutputOptions {
	return {
		entrypoint: adapter?.entrypointResolution === 'auto' ? adapter.serverEntrypoint : undefined,
		internalFetchHeaders: adapter?.client?.internalFetchHeaders,
	};
}

/** The `@astrojs/vite-plugin-router` config of an Astro project. */
export function toRouterConfig(settings: AstroSettings): RouterConfig {
	const { config } = settings;
	return {
		root: config.root,
		srcDir: config.srcDir,
		publicDir: config.publicDir,
		base: config.base,
		site: config.site,
		compressHTML: config.compressHTML,
		trailingSlash: config.trailingSlash,
		output: config.output,
		build: {
			format: config.build.format,
			client: config.build.client,
			server: config.build.server,
			assets: config.build.assets,
			assetsPrefix: config.build.assetsPrefix,
			serverEntry: config.build.serverEntry,
			redirects: config.build.redirects,
			inlineStylesheets: config.build.inlineStylesheets,
			concurrency: config.build.concurrency,
		},
		redirects: config.redirects,
		security: {
			checkOrigin: config.security.checkOrigin,
			allowedDomains: config.security.allowedDomains,
			serverIslandBodySizeLimit: config.security.serverIslandBodySizeLimit,
		},
		serverOutput: settings.adapter ? toServerOutputOptions(settings) : undefined,
		outDir: config.outDir,
		cacheDir: config.cacheDir,
		pageExtensions: settings.pageExtensions,
		serverHeaders: config.server.headers,
	};
}
