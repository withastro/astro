import fs from 'node:fs';
import type http from 'node:http';
import type { AddressInfo } from 'node:net';
import { performance } from 'perf_hooks';
import type * as vite from 'vite';
import type { AstroInlineConfig } from '../../@types/astro';
import { attachContentServerListeners } from '../../content/index.js';
import { telemetry } from '../../events/index.js';
import { info, warn } from '../logger/core.js';
import * as msg from '../messages.js';
import { startContainer } from './container.js';
import { createContainerWithAutomaticRestart } from './restart.js';

export interface DevServer {
	address: AddressInfo;
	handle: (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => void;
	watcher: vite.FSWatcher;
	stop(): Promise<void>;
}

/** `astro dev` */
export default async function dev(inlineConfig: AstroInlineConfig): Promise<DevServer> {
	const devStart = performance.now();
	await telemetry.record([]);

	// Create a container which sets up the Vite server.
	const restart = await createContainerWithAutomaticRestart({ inlineConfig, fs });
	const logging = restart.container.logging;

	// Start listening to the port
	const devServerAddressInfo = await startContainer(restart.container);

	info(
		logging,
		null,
		msg.serverStart({
			startupTime: performance.now() - devStart,
			resolvedUrls: restart.container.viteServer.resolvedUrls || { local: [], network: [] },
			host: restart.container.settings.config.server.host,
			base: restart.container.settings.config.base,
		})
	);

	const currentVersion = process.env.PACKAGE_VERSION ?? '0.0.0';
	if (currentVersion.includes('-')) {
		warn(logging, null, msg.prerelease({ currentVersion }));
	}
	if (restart.container.viteServer.config.server?.fs?.strict === false) {
		warn(logging, null, msg.fsStrictWarning());
	}

	await attachContentServerListeners(restart.container);

	return {
		address: devServerAddressInfo,
		get watcher() {
			return restart.container.viteServer.watcher;
		},
		handle(req, res) {
			return restart.container.handle(req, res);
		},
		async stop() {
			await restart.container.close();
		},
	};
}
