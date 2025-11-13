import type { Plugin as VitePlugin } from 'vite';
import { astroHeadBuildPlugin } from '../../../vite-plugin-head/index.js';
import { pluginActions } from './plugin-actions.js';
import { pluginAnalyzer } from './plugin-analyzer.js';
import { pluginComponentEntry } from './plugin-component-entry.js';
import { pluginCSS } from './plugin-css.js';
import { pluginInternals } from './plugin-internals.js';
import { pluginManifestBuild } from './plugin-manifest.js';
import { pluginMiddleware } from './plugin-middleware.js';
import { pluginPages } from './plugin-pages.js';
import { pluginPrerender } from './plugin-prerender.js';
import { pluginPrerenderEntry } from './plugin-prerender-entry.js';
import { pluginScripts } from './plugin-scripts.js';
import { pluginSSR } from './plugin-ssr.js';

export function getAllBuildPlugins(
	internals: any,
	options: any,
): Array<VitePlugin | VitePlugin[] | undefined> {
	return [
		pluginComponentEntry(internals),
		pluginAnalyzer(internals),
		pluginInternals(options, internals),
		pluginManifestBuild(internals),
		pluginMiddleware(options, internals),
		pluginActions(options, internals),
		pluginPages(options, internals),
		...pluginCSS(options, internals),
		astroHeadBuildPlugin(internals),
		pluginPrerender(options, internals),
		pluginPrerenderEntry(options, internals),
		pluginScripts(internals),
		...pluginSSR(options, internals),
	].filter(Boolean) as Array<VitePlugin | VitePlugin[] | undefined>;
}
