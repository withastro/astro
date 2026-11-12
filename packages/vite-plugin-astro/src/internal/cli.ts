import type { AstroCompilePluginOptions } from './vite-plugin-astro/index.js';
import type { HeadPluginOptions } from './vite-plugin-head/index.js';
import type { HmrReloadPluginOptions } from './vite-plugin-hmr-reload/index.js';
import type { RenderersPluginOptions } from './vite-plugin-renderers/index.js';
import type { InjectedScript } from './vite-plugin-scripts/index.js';

/**
 * What the `astro` CLI passes to `astro()` besides its options: the values a plain Vite project
 * does not have (the full Astro config, the CLI logger, user preferences, integrations' scripts)
 * and the module ids that projects depending only on `astro` can resolve.
 *
 * With it, `astro()` leaves out the render API modules (`virtual:astro:render-setup`, the
 * client directives and component assets modules): the CLI renders pages itself.
 */
export interface AstroPluginCli
	extends Pick<
		AstroCompilePluginOptions,
		'logger' | 'toolbarEnabled' | 'internalURL' | 'transitionsAnimationURL'
	> {
	/**
	 * The config the compiler reads (`AstroConfig` satisfies it), instead of the one `astro()`
	 * builds from its options. Compile metadata is shared between the builds that use the same
	 * object.
	 */
	compileConfig: AstroCompilePluginOptions['config'];
	/** See `RenderersPluginOptions.skipRenderers`. */
	skipRenderers?: RenderersPluginOptions['skipRenderers'];
	/** See `HeadPluginOptions.environments`. */
	headEnvironments?: HeadPluginOptions['environments'];
	/** See `HmrReloadPluginOptions.getDevCssModuleId`. */
	getDevCssModuleId?: HmrReloadPluginOptions['getDevCssModuleId'];
	/**
	 * Scripts of every page (integrations' `injectScript()`), read on use. `astro()` serves the
	 * `before-hydration` ones as `astro:scripts/before-hydration.js`.
	 */
	scripts?: readonly InjectedScript[];
}
