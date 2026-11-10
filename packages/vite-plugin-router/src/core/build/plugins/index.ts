import type { Plugin as VitePlugin } from 'vite';
import { astroHeadBuildPlugin } from '../../../vite-plugin-head/index.js';
import type { BuildInternals } from '../../../internal/core/build/internal.js';
import type { StaticBuildOptionsInput } from '../../../internal/core/build/types.js';
import { pluginAnalyzer } from './plugin-analyzer.js';
import { pluginComponentEntry } from './plugin-component-entry.js';
import { pluginCSS } from './plugin-css.js';
import { pluginCssTargetLowering } from './plugin-css-target-lowering.js';
import { pluginInternals } from './plugin-internals.js';
import { pluginMiddleware } from './plugin-middleware.js';
import { pluginPrerender } from './plugin-prerender.js';
import { pluginScripts } from '../../../internal/core/build/plugins/plugin-scripts.js';
import { pluginChunkImports } from './plugin-chunk-imports.js';
import { pluginNoop } from './plugin-noop.js';
import { vitePluginSSRAssets } from '../../../internal/core/build/vite-plugin-ssr-assets.js';

export function getAllBuildPlugins(
	internals: BuildInternals,
	options: StaticBuildOptionsInput,
): Array<VitePlugin | VitePlugin[] | undefined> {
	return [
		pluginComponentEntry(internals),
		pluginAnalyzer(internals),
		pluginInternals(options, internals),
		pluginMiddleware(internals),
		pluginCssTargetLowering(),
		...pluginCSS(options, internals),
		astroHeadBuildPlugin(internals),
		pluginPrerender(options, internals),
		pluginScripts(internals),
		pluginNoop(),
		vitePluginSSRAssets(internals),
		pluginChunkImports(options),
		...options.host.plugins(internals, options),
	].filter(Boolean);
}
