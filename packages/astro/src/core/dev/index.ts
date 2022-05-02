import type { AddressInfo } from 'net';
import type { AstroTelemetry } from '@astrojs/telemetry';
import { performance } from 'perf_hooks';
import * as vite from 'vite';
import type { AstroConfig } from '../../@types/astro';
import {
	runHookConfigDone,
	runHookConfigSetup,
	runHookServerDone,
	runHookServerSetup,
	runHookServerStart,
} from '../../integrations/index.js';
import { createVite } from '../create-vite.js';
import { info, LogOptions, warn, warnIfUsingExperimentalSSR } from '../logger/core.js';
import { nodeLogOptions } from '../logger/node.js';
import * as msg from '../messages.js';
import { apply as applyPolyfill } from '../polyfill.js';

export interface DevOptions {
	logging: LogOptions;
	telemetry: AstroTelemetry;
}

export interface DevServer {
	address: AddressInfo;
	stop(): Promise<void>;
}

/** `astro dev` */
export default async function dev(config: AstroConfig, options: DevOptions): Promise<DevServer> {
	const devStart = performance.now();
	applyPolyfill();
	await options.telemetry.record([]);
	config = await runHookConfigSetup({ config, command: 'dev' });
	const { host, port } = config.server;
	const viteConfig = await createVite(
		{
			mode: 'development',
			server: { host },
		},
		{ astroConfig: config, logging: options.logging, mode: 'dev' }
	);
	await runHookConfigDone({ config });
	warnIfUsingExperimentalSSR(options.logging, config);
	const viteServer = await vite.createServer(viteConfig);
	runHookServerSetup({ config, server: viteServer });
	await viteServer.listen(port);

	const devServerAddressInfo = viteServer.httpServer!.address() as AddressInfo;
	const site = config.site ? new URL(config.base, config.site) : undefined;
	info(
		options.logging,
		null,
		msg.devStart({
			startupTime: performance.now() - devStart,
			config,
			devServerAddressInfo,
			site,
			https: !!viteConfig.server?.https,
		})
	);

	const currentVersion = process.env.PACKAGE_VERSION ?? '0.0.0';
	if (currentVersion.includes('-')) {
		warn(options.logging, null, msg.prerelease({ currentVersion }));
	}

	await runHookServerStart({ config, address: devServerAddressInfo });

	return {
		address: devServerAddressInfo,
		stop: async () => {
			await viteServer.close();
			await runHookServerDone({ config });
		},
	};
}
