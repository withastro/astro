import type { AstroTelemetry } from '@astrojs/telemetry';
import type { AddressInfo } from 'net';
import { performance } from 'perf_hooks';
import * as vite from 'vite';
import type { AstroSettings } from '../../@types/astro';
import {
	runHookConfigDone,
	runHookConfigSetup,
	runHookServerDone,
	runHookServerSetup,
	runHookServerStart,
} from '../../integrations/index.js';
import { createVite } from '../create-vite.js';
import { info, LogOptions, warn } from '../logger/core.js';
import * as msg from '../messages.js';
import { apply as applyPolyfill } from '../polyfill.js';

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
	applyPolyfill();
	await options.telemetry.record([]);
	settings = await runHookConfigSetup({ settings, command: 'dev', logging: options.logging });
	const { host, port } = settings.config.server;
	const { isRestart = false } = options;

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
		},
		{ settings, logging: options.logging, mode: 'dev' }
	);
	await runHookConfigDone({ settings, logging: options.logging });
	const viteServer = await vite.createServer(viteConfig);
	runHookServerSetup({ config: settings.config, server: viteServer, logging: options.logging });
	await viteServer.listen(port);

	const site = settings.config.site
		? new URL(settings.config.base, settings.config.site)
		: undefined;
	info(
		options.logging,
		null,
		msg.serverStart({
			startupTime: performance.now() - devStart,
			resolvedUrls: viteServer.resolvedUrls || { local: [], network: [] },
			host: settings.config.server.host,
			site,
			isRestart,
		})
	);

	const currentVersion = process.env.PACKAGE_VERSION ?? '0.0.0';
	if (currentVersion.includes('-')) {
		warn(options.logging, null, msg.prerelease({ currentVersion }));
	}
	if (viteConfig.server?.fs?.strict === false) {
		warn(options.logging, null, msg.fsStrictWarning());
	}

	const devServerAddressInfo = viteServer.httpServer!.address() as AddressInfo;
	await runHookServerStart({
		config: settings.config,
		address: devServerAddressInfo,
		logging: options.logging,
	});

	return {
		address: devServerAddressInfo,
		get watcher() {
			return viteServer.watcher;
		},
		stop: async () => {
			await viteServer.close();
			await runHookServerDone({ config: settings.config, logging: options.logging });
		},
	};
}
