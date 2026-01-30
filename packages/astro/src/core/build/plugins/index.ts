import type { Plugin as VitePlugin } from 'vite';
import { vitePluginActionsBuild } from '../../../actions/vite-plugin-actions.js';
import { astroHeadBuildPlugin } from '../../../vite-plugin-head/index.js';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
import { pluginAnalyzer } from './plugin-analyzer.js';
import { pluginComponentEntry } from './plugin-component-entry.js';
import { pluginCSS } from './plugin-css.js';
import { pluginInternals } from './plugin-internals.js';
import { pluginMiddleware } from './plugin-middleware.js';
import { pluginPrerender } from './plugin-prerender.js';
import { pluginScripts } from './plugin-scripts.js';
import { pluginSSR } from './plugin-ssr.js';
import { pluginNoop } from './plugin-noop.js';
import { vitePluginSSRAssets } from '../vite-plugin-ssr-assets.js';

export function getAllBuildPlugins(
	internals: BuildInternals,
	options: StaticBuildOptions,
): Array<VitePlugin | VitePlugin[] | undefined> {
	return [
		pluginComponentEntry(internals),
		pluginAnalyzer(internals),
		pluginInternals(options, internals),
		pluginMiddleware(options, internals),
		vitePluginActionsBuild(options, internals),
		...pluginCSS(options, internals),
		astroHeadBuildPlugin(internals),
		pluginPrerender(options, internals),
		pluginScripts(internals),
		...pluginSSR(options, internals),
		pluginNoop(),
		vitePluginSSRAssets(internals),
	].filter(Boolean);
}
