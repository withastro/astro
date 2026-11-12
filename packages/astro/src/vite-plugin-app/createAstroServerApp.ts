import type http from 'node:http';
import { manifest } from 'virtual:astro:manifest';
import { clearActions } from '../actions/load.js';
import { getPackageManager } from '../cli/info/core/get-package-manager.js';
import { DevDebugInfoProvider } from '../cli/info/infra/dev-debug-info-provider.js';
import { ProcessNodeVersionProvider } from '../cli/info/infra/process-node-version-provider.js';
import { ProcessPackageManagerUserAgentProvider } from '../cli/info/infra/process-package-manager-user-agent-provider.js';
import { StyledDebugInfoFormatter } from '../cli/info/infra/styled-debug-info-formatter.js';
import { BuildTimeAstroVersionProvider } from '../cli/infra/build-time-astro-version-provider.js';
import { PassthroughTextStyler } from '../cli/infra/passthrough-text-styler.js';
import { ProcessOperatingSystemProvider } from '../cli/infra/process-operating-system-provider.js';
import { TinyexecCommandExecutor } from '../cli/infra/tinyexec-command-executor.js';
import { DevFacadeApp } from '../core/app/dev-facade.js';
import type { RouteInfo } from '../core/app/types.js';
import { setEnvironment } from '../core/environment/index.js';
import type { AstroLogger } from '../core/logger/core.js';
import { createNodeLoggerFromFlags } from '../core/logger/impls/node.js';
import { setLogger } from '../core/logger/manifest-logger.js';
import { clearMiddleware } from '../core/middleware/load.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import { getRouteCache } from '../core/render/route-cache.js';
import { updateRouteTable } from '../core/routing/route-table.js';
import type { AstroSettings } from '../types/astro.js';
import type { DevServerController } from '../vite-plugin-astro-server/controller.js';
import { createRunnableEnvironment } from './environment.js';
import { type DevRequestDeps, handleDevRequest } from './handle-request.js';

export default async function createAstroServerApp(
	controller: DevServerController,
	settings: AstroSettings,
	loader: ModuleLoader,
	logger?: AstroLogger,
) {
	const actualLogger = logger ?? createNodeLoggerFromFlags({});

	const debugInfoProvider = new DevDebugInfoProvider({
		config: settings.config,
		astroVersionProvider: new BuildTimeAstroVersionProvider(),
		operatingSystemProvider: new ProcessOperatingSystemProvider(),
		packageManager: await getPackageManager({
			packageManagerUserAgentProvider: new ProcessPackageManagerUserAgentProvider(),
			commandExecutor: new TinyexecCommandExecutor(),
		}),
		nodeVersionProvider: new ProcessNodeVersionProvider(),
	});
	const debugInfoFormatter = new StyledDebugInfoFormatter({
		textStyler: new PassthroughTextStyler(),
	});
	const debugInfo = debugInfoFormatter.format(await debugInfoProvider.get());

	// Composition order: logger → environment → facade ctor
	// (which warms the route table from `manifest.routes` — in dev that IS the
	// live array behind `virtual:astro:routes`, so no separate routes import
	// is needed) → HMR wiring. The ModuleLoader and AstroSettings are captured
	// in the environment closure and in `deps`; they are unreachable from
	// requests/states.
	setLogger(manifest, actualLogger);
	setEnvironment(
		manifest,
		createRunnableEnvironment({ loader, settings, getDebugInfo: async () => debugInfo }),
	);
	const app = new DevFacadeApp(manifest, true);
	const deps: DevRequestDeps = { loader, settings, controller };

	// The HMR listeners target the MANIFEST via the functional core: one
	// atomic route-table replacement is visible to every consumer — matcher,
	// custom-404 fallback, rewrites, error-page lookups, and the
	// `manifestData` accessors — at once.
	if (import.meta.hot) {
		import.meta.hot.on('astro:routes-updated', async () => {
			try {
				// Re-import the routes module to get fresh routes
				const { routes: newRoutes } = await import('virtual:astro:routes');
				updateRouteTable(
					manifest,
					newRoutes.map((route: RouteInfo) => route.routeData),
				);
				actualLogger.debug('router', 'Routes updated via HMR');
			} catch (e: any) {
				actualLogger.error('router', `Failed to update routes via HMR:\n ${e}`);
			}
		});

		// Listen for content collection changes via HMR.
		// Clear the route cache so getStaticPaths() is re-evaluated with fresh data.
		import.meta.hot.on('astro:content-changed', () => {
			getRouteCache(manifest).clearAll();
			actualLogger.debug('router', 'Route cache cleared due to content change');
		});

		// Listen for middleware file changes via HMR.
		// Clear the cached middleware so it is re-resolved on the next request.
		import.meta.hot.on('astro:middleware-updated', () => {
			clearMiddleware(manifest);
			actualLogger.debug('router', 'Middleware cache cleared due to file change');
		});

		// Listen for action file changes via HMR.
		// Clear the cached actions so they are re-resolved on the next request.
		import.meta.hot.on('astro:actions-updated', () => {
			clearActions(manifest);
			actualLogger.debug('router', 'Actions cache cleared due to file change');
		});
	}

	return {
		handler(
			incomingRequest: http.IncomingMessage,
			incomingResponse: http.ServerResponse,
			options?: { prerenderOnly?: boolean },
		) {
			return handleDevRequest(app, deps, {
				incomingRequest,
				incomingResponse,
				isHttps: loader?.isHttps() ?? false,
				prerenderOnly: options?.prerenderOnly,
			});
		},
	};
}
