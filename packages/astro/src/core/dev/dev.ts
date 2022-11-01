import type { AstroTelemetry } from '@astrojs/telemetry';
import type { AddressInfo } from 'net';
import { performance } from 'perf_hooks';
import * as vite from 'vite';
import type { AstroSettings } from '../../@types/astro';
import { runHookServerDone } from '../../integrations/index.js';
import { info, LogOptions, warn } from '../logger/core.js';
import * as msg from '../messages.js';
import { createContainer, startContainer } from './container.js';

export interface DevOptions {
	logging: LogOptions;
	telemetry: AstroTelemetry;
	isRestart?: boolean;
}

export interface DevServer {
	address: AddressInfo;
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
	const container = await createContainer({
		settings,
		logging: options.logging,
		isRestart: options.isRestart,
	});

	// Start listening to the port
	const devServerAddressInfo = await startContainer(container);

	const site = settings.config.site
		? new URL(settings.config.base, settings.config.site)
		: undefined;
	info(
		options.logging,
		null,
		msg.serverStart({
			startupTime: performance.now() - devStart,
			resolvedUrls: container.viteServer.resolvedUrls || { local: [], network: [] },
			host: settings.config.server.host,
			site,
			isRestart: options.isRestart,
		})
	);

	const currentVersion = process.env.PACKAGE_VERSION ?? '0.0.0';
	if (currentVersion.includes('-')) {
		warn(options.logging, null, msg.prerelease({ currentVersion }));
	}
	if (container.viteConfig.server?.fs?.strict === false) {
		warn(options.logging, null, msg.fsStrictWarning());
	}

	return {
		address: devServerAddressInfo,
		get watcher() {
			return container.viteServer.watcher;
		},
		stop: async () => {
			await container.close();
			await runHookServerDone({ config: settings.config, logging: options.logging });
		},
	};
}
