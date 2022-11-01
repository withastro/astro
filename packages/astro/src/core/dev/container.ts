
import type { AddressInfo } from 'net';
import type { AstroSettings, AstroUserConfig } from '../../@types/astro';
import * as http from 'http';

import {
	runHookConfigDone,
	runHookConfigSetup,
	runHookServerSetup,
	runHookServerStart,
} from '../../integrations/index.js';
import { createVite } from '../create-vite.js';
import {  LogOptions } from '../logger/core.js';
import { nodeLogDestination } from '../logger/node.js';
import nodeFs from 'fs';
import * as vite from 'vite';
import { createDefaultDevSettings } from '../config/index.js';
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
}

export async function createContainer(params: CreateContainerParams = {}): Promise<Container> {
	let {
		isRestart = false,
		logging = defaultLogging,
		settings = await createDefaultDevSettings(params.userConfig, params.root),
		fs = nodeFs
	} = params;

	// Initialize
	applyPolyfill();
	settings = await runHookConfigSetup({
		settings,
		command: 'dev',
		logging,
		isRestart,
	});
	const { host } = settings.config.server;

	// The client entrypoint for renderers. Since these are imported dynamically
	// we need to tell Vite to preoptimize them.
	const rendererClientEntries = settings.renderers
		.map((r) => r.clientEntrypoint)
		.filter(Boolean) as string[];

	const viteConfig = await createVite(
		{
			mode: 'development',
			server: { host },
			optimizeDeps: {
				include: rendererClientEntries,
			},
			define: {
				'import.meta.env.BASE_URL': settings.config.base
					? `'${settings.config.base}'`
					: 'undefined',
			},
		},
		{ settings, logging, mode: 'dev', fs }
	);
	await runHookConfigDone({ settings, logging });
	const viteServer = await vite.createServer(viteConfig);
	runHookServerSetup({ config: settings.config, server: viteServer, logging });

	return {
		fs,
		logging,
		settings,
		viteConfig,
		viteServer,

		handle(req, res) {
			viteServer.middlewares.handle(req, res, Function.prototype);
		},
		close() {
			return viteServer.close();
		}
	};
}

export async function startContainer({ settings, viteServer, logging }: Container): Promise<AddressInfo> {
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

export async function runInContainer(params: CreateContainerParams, callback: (container: Container) => Promise<void> | void) {
	const container = await createContainer(params);
	try {
		await callback(container);
	} finally {
		await container.close();
	}
}
