import type { OutgoingHttpHeaders } from 'node:http';
import type { AstroRenderer } from '@astrojs/vite-plugin-astro';
import type { ViteDevServer } from 'vite';
import type { RoutesList } from '../routing.js';
import type { TransitionsModuleIds } from '../transitions/vite-plugin-transitions.js';
import type { AssetsPrefix } from './core/app/types.js';
import type { AstroLogger } from './core/logger/core.js';
import type { ServerIslandsState } from './core/server-islands/shared-state.js';
import type { ManifestHostFields } from './manifest/serialized.js';
import type { DevHeadElements } from './vite-plugin-app/environment.js';
import type { RoutesPluginOptions } from './vite-plugin-routes/index.js';

/**
 * What the `astro` CLI passes to `router()` besides its options: the values a plain Vite project
 * takes from Vite, and the parts of an Astro project that are not plugin options (integrations,
 * the adapter, the dev toolbar).
 *
 * With it, `router()` serves the route table the CLI created before Vite started, adds the dev
 * server plugins only for `command: 'dev'`, and leaves the production build to `astro build`.
 */
export interface RouterPluginCli {
	logger: AstroLogger;
	command: 'dev' | 'build';
	/** Whether the config is created by `astro sync`, which loads no server modules. */
	sync: boolean;
	/** The route table, filled before Vite starts and updated in place. */
	routesList: RoutesList;
	/** The values of the config that a plain Vite project takes from Vite's config. */
	config: {
		base: string;
		outDir: URL;
		cacheDir: URL;
		serverHeaders: OutgoingHttpHeaders | undefined;
		build: { client: URL; server: URL; assetsPrefix: AssetsPrefix | undefined };
		/** Read each time the route table is created, so later additions are included. */
		pageExtensions: readonly string[];
	};
	/** Module ids of the view transitions modules, which projects that depend only on `astro` resolve. */
	transitionsModuleIds: Partial<TransitionsModuleIds>;
	createRoutes: RoutesPluginOptions['createRoutes'];
	isRouteFile: (file: URL) => boolean;
	isPage: (file: URL) => boolean;
	onRouteSetup?: RoutesPluginOptions['onRouteSetup'];
	headInlineScripts?: RoutesPluginOptions['headInlineScripts'];
	/** The serialized manifest fields that come from the adapter and the project's features. */
	manifestHostFields: () => Promise<ManifestHostFields>;
	/** Module that exports the logger of the server runtime, if any. */
	loggerModuleId: () => string | undefined;
	/** Throws when the project needs a middleware file it does not have. */
	validateMiddleware?: (context: { userMiddlewareIsPresent: boolean }) => void;
	/** Whether the project uses server islands, shared with other plugins. */
	serverIslandsState: ServerIslandsState;
	canRenderOnDemand: () => boolean;
	/** File whose default export handles requests; `null` disables it. */
	fetchFile: string | null | undefined;
	renderers: readonly AstroRenderer[];
	headElements?: DevHeadElements;
	/** Awaited before the dev server apps are created. */
	prepareDevServer?: (server: ViteDevServer) => Promise<void>;
	/** CSS of the modules the dev server rendered, by module id, shared with other plugins. */
	cssContentCache?: Map<string, string>;
}
