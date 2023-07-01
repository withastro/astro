import type * as http from 'http';
import type { AddressInfo } from 'net';
import type { AstroSettings, AstroUserConfig } from '../../@types/astro';

import nodeFs from 'fs';
import * as vite from 'vite';
import {
	runHookConfigDone,
	runHookConfigSetup,
	runHookServerDone,
	runHookServerStart,
} from '../../integrations/index.js';
import { createDefaultDevSettings, resolveRoot } from '../config/index.js';
import { createVite } from '../create-vite.js';
import type { LogOptions } from '../logger/core.js';
import { nodeLogDestination } from '../logger/node.js';
import { appendForwardSlash } from '../path.js';
import { apply as applyPolyfill } from '../polyfill.js';

const defaultLogging: LogOptions = {
	dest: nodeLogDestination,
	level: 'error',
};

export interface Container {
	fs: typeof nodeFs;
	logging: LogOptions;
	settings: AstroSettings;
	viteConfig: vite.InlineConfig;
	viteServer: vite.ViteDevServer;
	resolvedRoot: string;
	configFlag: string | undefined;
	configFlagPath: string | undefined;
	restartInFlight: boolean; // gross
	handle: (req: http.IncomingMessage, res: http.ServerResponse) => void;
	close: () => Promise<void>;
}

export interface CreateContainerParams {
	isRestart?: boolean;
	logging?: LogOptions;
	userConfig?: AstroUserConfig;
	settings?: AstroSettings;
	fs?: typeof nodeFs;
	root?: string | URL;
	// The string passed to --config and the resolved path
	configFlag?: string;
	configFlagPath?: string;
}

export async function createContainer(params: CreateContainerParams = {}): Promise<Container> {
	let {
		isRestart = false,
		logging = defaultLogging,
		settings = await createDefaultDevSettings(params.userConfig, params.root),
		fs = nodeFs,
	} = params;

	// Initialize
	applyPolyfill();
	settings = await runHookConfigSetup({
		settings,
		command: 'dev',
		logging,
		isRestart,
	});
	const { host, headers, open } = settings.config.server;

	// The client entrypoint for renderers. Since these are imported dynamically
	// we need to tell Vite to preoptimize them.
	const rendererClientEntries = settings.renderers
		.map((r) => r.clientEntrypoint)
		.filter(Boolean) as string[];

	const viteConfig = await createVite(
		{
			mode: 'development',
			server: { host, headers, open },
			optimizeDeps: {
				include: rendererClientEntries,
			},
		},
		{ settings, logging, mode: 'dev', command: 'dev', fs }
	);
	await runHookConfigDone({ settings, logging });
	const viteServer = await vite.createServer(viteConfig);

	const container: Container = {
		configFlag: params.configFlag,
		configFlagPath: params.configFlagPath,
		fs,
		logging,
		resolvedRoot: appendForwardSlash(resolveRoot(params.root)),
		restartInFlight: false,
		settings,
		viteConfig,
		viteServer,
		handle(req, res) {
			viteServer.middlewares.handle(req, res, Function.prototype);
		},
		// TODO deprecate and remove
		close() {
			return closeContainer(container);
		},
	};

	return container;
}

async function closeContainer({ viteServer, settings, logging }: Container) {
	await viteServer.close();
	await runHookServerDone({
		config: settings.config,
		logging,
	});
}

export async function startContainer({
	settings,
	viteServer,
	logging,
}: Container): Promise<AddressInfo> {
	const { port } = settings.config.server;
	await viteServer.listen(port);
	const devServerAddressInfo = viteServer.httpServer!.address() as AddressInfo;
	await runHookServerStart({
		config: settings.config,
		address: devServerAddressInfo,
		logging,
	});

	return devServerAddressInfo;
}

export function isStarted(container: Container): boolean {
	return !!container.viteServer.httpServer?.listening;
}

/**
 * Only used in tests
 */
export async function runInContainer(
	params: CreateContainerParams,
	callback: (container: Container) => Promise<void> | void
) {
	const container = await createContainer(params);
	try {
		await callback(container);
	} finally {
		await container.close();
	}
}
