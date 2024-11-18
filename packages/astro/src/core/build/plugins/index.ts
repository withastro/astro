import { astroConfigBuildPlugin } from '../../../content/vite-plugin-content-assets.js';
import { astroHeadBuildPlugin } from '../../../vite-plugin-head/index.js';
import type { AstroBuildPluginContainer } from '../plugin.js';
import { pluginAnalyzer } from './plugin-analyzer.js';
import { pluginChunks } from './plugin-chunks.js';
import { pluginComponentEntry } from './plugin-component-entry.js';
import { pluginContent } from './plugin-content.js';
import { pluginCSS } from './plugin-css.js';
import { pluginHoistedScripts } from './plugin-hoisted-scripts.js';
import { pluginInternals } from './plugin-internals.js';
import { pluginManifest } from './plugin-manifest.js';
import { pluginMiddleware } from './plugin-middleware.js';
import { pluginPages } from './plugin-pages.js';
import { pluginPrerender } from './plugin-prerender.js';
import { pluginRenderers } from './plugin-renderers.js';
import { pluginScripts } from './plugin-scripts.js';
import { pluginSSR, pluginSSRSplit } from './plugin-ssr.js';

export function registerAllPlugins({ internals, options, register }: AstroBuildPluginContainer) {
	register(pluginComponentEntry(internals));
	register(pluginAnalyzer(options, internals));
	register(pluginInternals(internals));
	register(pluginManifest(options, internals));
	register(pluginRenderers(options));
	register(pluginMiddleware(options, internals));
	register(pluginPages(options, internals));
	register(pluginContent(options, internals));
	register(pluginCSS(options, internals));
	register(astroHeadBuildPlugin(internals));
	register(pluginPrerender(options, internals));
	register(astroConfigBuildPlugin(options, internals));
	if (options.settings.config.experimental.directRenderScript) {
		register(pluginScripts(internals));
	} else {
		register(pluginHoistedScripts(internals));
	}
	register(pluginSSR(options, internals));
	register(pluginSSRSplit(options, internals));
	register(pluginChunks());
}
