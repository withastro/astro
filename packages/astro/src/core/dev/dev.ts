import type { AstroTelemetry } from '@astrojs/telemetry';
import type http from 'http';
import type { AddressInfo } from 'net';
import { performance } from 'perf_hooks';
import * as vite from 'vite';
import type { AstroSettings } from '../../@types/astro';
import { info, LogOptions, warn } from '../logger/core.js';
import * as msg from '../messages.js';
import { startContainer } from './container.js';
import { createContainerWithAutomaticRestart } from './restart.js';

export interface DevOptions {
	configFlag: string | undefined;
	configFlagPath: string | undefined;
	logging: LogOptions;
	telemetry: AstroTelemetry;
	handleConfigError: (error: Error) => void;
	isRestart?: boolean;
}

export interface DevServer {
	address: AddressInfo;
	handle: (req: http.IncomingMessage, res: http.ServerResponse<http.IncomingMessage>) => void;
	watcher: vite.FSWatcher;
	stop(): Promise<void>;
}

/** `astro dev` */
export default async function dev(
	settings: AstroSettings,
	options: DevOptions
): Promise<DevServer> {
	const devStart = performance.now();
	await options.telemetry.record([]);

	// Create a container which sets up the Vite server.
	const restart = await createContainerWithAutomaticRestart({
		flags: {},
		handleConfigError: options.handleConfigError,
		// eslint-disable-next-line no-console
		beforeRestart: () => console.clear(),
		params: {
			settings,
			logging: options.logging,
			isRestart: options.isRestart,
		},
	});

	// Start listening to the port
	const devServerAddressInfo = await startContainer(restart.container);

	const site = settings.config.site
		? new URL(settings.config.base, settings.config.site)
		: undefined;
	info(
		options.logging,
		null,
		msg.serverStart({
			startupTime: performance.now() - devStart,
			resolvedUrls: restart.container.viteServer.resolvedUrls || { local: [], network: [] },
			host: settings.config.server.host,
			site,
			isRestart: options.isRestart,
		})
	);

	const currentVersion = process.env.PACKAGE_VERSION ?? '0.0.0';
	if (currentVersion.includes('-')) {
		warn(options.logging, null, msg.prerelease({ currentVersion }));
	}
	if (restart.container.viteConfig.server?.fs?.strict === false) {
		warn(options.logging, null, msg.fsStrictWarning());
	}

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
