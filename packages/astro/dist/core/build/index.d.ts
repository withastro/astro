import type { AstroSettings, RoutesList } from '../../types/astro.js';
import type { AstroInlineConfig, RuntimeMode } from '../../types/public/config.js';
import type { AstroLogger } from '../logger/core.js';
interface BuildOptions {
	/**
	 * Output a development-based build similar to code transformed in `astro dev`. This
	 * can be useful to test build-only issues with additional debugging information included.
	 *
	 * @default false
	 */
	devOutput?: boolean;
	/**
	 * Teardown the compiler WASM instance after build. This can improve performance when
	 * building once, but may cause a performance hit if building multiple times in a row.
	 *
	 * When building multiple projects in the same execution (e.g. during tests), disabling
	 * this option can greatly improve performance at the cost of some extra memory usage.
	 *
	 * @default true
	 */
	teardownCompiler?: boolean;
}
/**
 * Builds your site for deployment. By default, this will generate static files and place them in a dist/ directory.
 * If SSR is enabled, this will generate the necessary server files to serve your site.
 *
 * @experimental The JavaScript API is experimental
 */
export default function build(
	inlineConfig: AstroInlineConfig,
	options?: BuildOptions,
): Promise<void>;
interface AstroBuilderOptions extends BuildOptions {
	logger: AstroLogger;
	mode: string;
	runtimeMode: RuntimeMode;
	/**
	 * Provide a pre-built routes list to skip filesystem route scanning.
	 * Useful for testing builds with in-memory virtual modules.
	 */
	routesList?: RoutesList;
	/**
	 * Whether to run `syncInternal` during setup. Defaults to true.
	 * Set to false for in-memory builds that don't need type generation.
	 */
	sync?: boolean;
}
export declare class AstroBuilder {
	private settings;
	private logger;
	private mode;
	private runtimeMode;
	private origin;
	private routesList;
	private timer;
	private teardownCompiler;
	private sync;
	constructor(settings: AstroSettings, options: AstroBuilderOptions);
	/** Setup Vite and run any async setup logic that couldn't run inside of the constructor. */
	private setup;
	/** Run the build logic. build() is marked private because usage should go through ".run()" */
	private build;
	/** Build the given Astro project.  */
	run(): Promise<void>;
	private validateConfig;
	/** Stats */
	private printStats;
}
export {};
