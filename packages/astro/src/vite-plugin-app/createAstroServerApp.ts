import type http from 'node:http';
import { manifest } from 'virtual:astro:manifest';
import { routes } from 'virtual:astro:routes';
import { getPackageManager } from '../cli/info/core/get-package-manager.js';
import { createDevDebugInfoProvider } from '../cli/info/infra/dev-debug-info-provider.js';
import { createProcessNodeVersionProvider } from '../cli/info/infra/process-node-version-provider.js';
import { createProcessPackageManagerUserAgentProvider } from '../cli/info/infra/process-package-manager-user-agent-provider.js';
import { createStyledDebugInfoFormatter } from '../cli/info/infra/styled-debug-info-formatter.js';
import { createBuildTimeAstroVersionProvider } from '../cli/infra/build-time-astro-version-provider.js';
import { createPassthroughTextStyler } from '../cli/infra/passthrough-text-styler.js';
import { createProcessOperatingSystemProvider } from '../cli/infra/process-operating-system-provider.js';
import { createTinyexecCommandExecutor } from '../cli/infra/tinyexec-command-executor.js';
import type { RouteInfo } from '../core/app/types.js';
import { Logger } from '../core/logger/core.js';
import { nodeLogDestination } from '../core/logger/node.js';
import type { ModuleLoader } from '../core/module-loader/index.js';
import type { AstroSettings, RoutesList } from '../types/astro.js';
import type { DevServerController } from '../vite-plugin-astro-server/controller.js';
import { AstroServerApp } from './app.js';

export default async function createAstroServerApp(
	controller: DevServerController,
	settings: AstroSettings,
	loader: ModuleLoader,
	logger?: Logger,
) {
	const actualLogger =
		logger ??
		new Logger({
			dest: nodeLogDestination,
			level: settings.logLevel,
		});
	const routesList: RoutesList = { routes: routes.map((r: RouteInfo) => r.routeData) };

	const debugInfoProvider = createDevDebugInfoProvider({
		config: settings.config,
		astroVersionProvider: createBuildTimeAstroVersionProvider(),
		operatingSystemProvider: createProcessOperatingSystemProvider(),
		packageManager: await getPackageManager({
			packageManagerUserAgentProvider: createProcessPackageManagerUserAgentProvider(),
			commandExecutor: createTinyexecCommandExecutor(),
		}),
		nodeVersionProvider: createProcessNodeVersionProvider(),
	});
	const debugInfoFormatter = createStyledDebugInfoFormatter({
		textStyler: createPassthroughTextStyler(),
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
	return {
		handler(incomingRequest: http.IncomingMessage, incomingResponse: http.ServerResponse) {
			app.handleRequest({
				controller,
				incomingRequest,
				incomingResponse,
				isHttps: loader?.isHttps() ?? false,
			});
		},
	};
}
