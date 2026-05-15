import type { AstroPrerenderer } from '../../types/public/integrations.js';
import type { BuildInternals } from './internal.js';
import type { StaticBuildOptions } from './types.js';
import type { BuildApp } from './app.js';
interface DefaultPrerendererOptions {
	internals: BuildInternals;
	options: StaticBuildOptions;
	prerenderOutputDir: URL;
}
/**
 * Default prerenderer with access to the BuildApp for assets generation.
 */
export interface DefaultPrerenderer extends AstroPrerenderer {
	/** The BuildApp instance, available after setup() is called */
	app?: BuildApp;
}
/**
 * Creates the default prerenderer that uses Node to import the bundle and render pages.
 * This is used when no custom prerenderer is set by an adapter.
 */
export declare function createDefaultPrerenderer({
	internals,
	options,
	prerenderOutputDir,
}: DefaultPrerendererOptions): DefaultPrerenderer;
export {};
