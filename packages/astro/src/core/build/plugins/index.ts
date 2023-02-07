import { astroConfigBuildPlugin } from '../../../content/vite-plugin-content-assets.js';
import type { AstroBuildPluginContainer } from '../plugin';
import { pluginAliasResolve } from './plugin-alias-resolve.js';
import { pluginAnalyzer } from './plugin-analyzer.js';
import { pluginCSS } from './plugin-css.js';
import { pluginHoistedScripts } from './plugin-hoisted-scripts.js';
import { pluginInternals } from './plugin-internals.js';
import { pluginPages } from './plugin-pages.js';
import { pluginPrerender } from './plugin-prerender.js';
import { pluginSSR } from './plugin-ssr.js';
import { astroHeadPropagationBuildPlugin } from '../../../vite-plugin-head-propagation/index.js';

export function registerAllPlugins({ internals, options, register }: AstroBuildPluginContainer) {
	register(pluginAliasResolve(internals));
	register(pluginAnalyzer(internals));
	register(pluginInternals(internals));
	register(pluginPages(options, internals));
	register(pluginCSS(options, internals));
	register(astroHeadPropagationBuildPlugin(options, internals));
	register(pluginPrerender(options, internals));
	register(astroConfigBuildPlugin(options, internals));
	register(pluginHoistedScripts(options, internals));
	register(pluginSSR(options, internals));
}
