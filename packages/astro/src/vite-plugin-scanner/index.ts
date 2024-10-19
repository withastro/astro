import { extname } from 'node:path';
import { bold } from 'kleur/colors';
import type { Plugin as VitePlugin } from 'vite';
import { normalizePath } from 'vite';
import type { AstroSettings, RouteOptions } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';
import { isEndpoint, isPage, isServerLikeOutput } from '../core/util.js';
import { rootRelativePath } from '../core/viteUtils.js';
import { runHookRouteSetup } from '../integrations/hooks.js';
import { getPrerenderDefault } from '../prerender/utils.js';
import type { PageOptions } from '../vite-plugin-astro/types.js';
import { scan } from './scan.js';

export interface AstroPluginScannerOptions {
	settings: AstroSettings;
	logger: Logger;
}

const KNOWN_FILE_EXTENSIONS = ['.astro', '.js', '.ts'];

export default function astroScannerPlugin({
	settings,
	logger,
}: AstroPluginScannerOptions): VitePlugin {
	return {
		name: 'astro:scanner',
		enforce: 'post',

		async transform(this, code, id, options) {
			if (!options?.ssr) return;

			const filename = normalizePath(id);
			let fileURL: URL;
			try {
				fileURL = new URL(`file://${filename}`);
			} catch {
				// If we can't construct a valid URL, exit early
				return;
			}

			const fileIsPage = isPage(fileURL, settings);
			const fileIsEndpoint = isEndpoint(fileURL, settings);
			if (!(fileIsPage || fileIsEndpoint)) return;
			const pageOptions = await getPageOptions(code, id, fileURL, settings, logger);

			// `getStaticPaths` warning is just a string check, should be good enough for most cases
			if (
				!pageOptions.prerender &&
				isServerLikeOutput(settings.config) &&
				code.includes('getStaticPaths') &&
				// this should only be valid for `.astro`, `.js` and `.ts` files
				KNOWN_FILE_EXTENSIONS.includes(extname(filename))
			) {
				logger.warn(
					'router',
					`getStaticPaths() ignored in dynamic page ${bold(
						rootRelativePath(settings.config.root, fileURL, true),
					)}. Add \`export const prerender = true;\` to prerender the page as static HTML during the build process.`,
				);
			}

			const { meta = {} } = this.getModuleInfo(id) ?? {};
			return {
				code,
				map: null,
				meta: {
					...meta,
					astro: {
						...(meta.astro ?? { hydratedComponents: [], clientOnlyComponents: [], scripts: [] }),
						pageOptions,
					},
				},
			};
		},
	};
}

async function getPageOptions(
	code: string,
	id: string,
	fileURL: URL,
	settings: AstroSettings,
	logger: Logger,
): Promise<PageOptions> {
	const fileUrlStr = fileURL.toString();
	const injectedRoute = settings.resolvedInjectedRoutes.find(
		(route) => route.resolvedEntryPoint && fileUrlStr === route.resolvedEntryPoint.toString(),
	);

	// Run initial scan
	const pageOptions =
		injectedRoute?.prerender != null
			? { prerender: injectedRoute.prerender }
			: await scan(code, id, settings);

	// Run integration hooks to alter page options
	const route: RouteOptions = {
		component: rootRelativePath(settings.config.root, fileURL, false),
		prerender: pageOptions.prerender,
	};
	await runHookRouteSetup({ route, settings, logger });
	pageOptions.prerender = route.prerender;

	// Fallback if unset
	if (typeof pageOptions.prerender === 'undefined') {
		pageOptions.prerender = getPrerenderDefault(settings.config);
	}

	return pageOptions;
}
