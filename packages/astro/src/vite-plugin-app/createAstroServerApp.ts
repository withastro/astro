import type http from 'node:http';
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
