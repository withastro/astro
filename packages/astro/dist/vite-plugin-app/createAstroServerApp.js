import { manifest } from 'virtual:astro:manifest';
import { routes } from 'virtual:astro:routes';
import { getPackageManager } from '../cli/info/core/get-package-manager.js';
import { DevDebugInfoProvider } from '../cli/info/infra/dev-debug-info-provider.js';
import { ProcessNodeVersionProvider } from '../cli/info/infra/process-node-version-provider.js';
import { ProcessPackageManagerUserAgentProvider } from '../cli/info/infra/process-package-manager-user-agent-provider.js';
import { StyledDebugInfoFormatter } from '../cli/info/infra/styled-debug-info-formatter.js';
import { BuildTimeAstroVersionProvider } from '../cli/infra/build-time-astro-version-provider.js';
import { PassthroughTextStyler } from '../cli/infra/passthrough-text-styler.js';
import { ProcessOperatingSystemProvider } from '../cli/infra/process-operating-system-provider.js';
import { TinyexecCommandExecutor } from '../cli/infra/tinyexec-command-executor.js';
import { AstroServerApp } from './app.js';
import { createNodeLoggerFromFlags } from '../core/logger/impls/node.js';
async function createAstroServerApp(controller, settings, loader, logger) {
	const actualLogger = logger ?? createNodeLoggerFromFlags({});
	const routesList = { routes: routes.map((r) => r.routeData) };
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
	const app = await AstroServerApp.create(
		manifest,
		routesList,
		actualLogger,
		loader,
		settings,
		async () => debugInfo,
	);
	if (import.meta.hot) {
		import.meta.hot.on('astro:routes-updated', async () => {
			try {
				const { routes: newRoutes } = await import('virtual:astro:routes');
				const newRoutesList = {
					routes: newRoutes.map((r) => r.routeData),
				};
				app.updateRoutes(newRoutesList);
				actualLogger.debug('router', 'Routes updated via HMR');
			} catch (e) {
				actualLogger.error(
					'router',
					`Failed to update routes via HMR:
 ${e}`,
				);
			}
		});
		import.meta.hot.on('astro:content-changed', () => {
			app.clearRouteCache();
			actualLogger.debug('router', 'Route cache cleared due to content change');
		});
		import.meta.hot.on('astro:middleware-updated', () => {
			app.clearMiddleware();
			actualLogger.debug('router', 'Middleware cache cleared due to file change');
		});
	}
	return {
		handler(incomingRequest, incomingResponse, options) {
			return app.handleRequest({
				controller,
				incomingRequest,
				incomingResponse,
				isHttps: loader?.isHttps() ?? false,
				prerenderOnly: options?.prerenderOnly,
			});
		},
	};
}
export { createAstroServerApp as default };
