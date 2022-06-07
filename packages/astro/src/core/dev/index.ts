import type { AstroTelemetry } from '@astrojs/telemetry';
import glob from 'fast-glob';
import type { AddressInfo } from 'net';
import path from 'path';
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
import * as msg from '../messages.js';
import { apply as applyPolyfill } from '../polyfill.js';

export interface DevOptions {
	logging: LogOptions;
	telemetry: AstroTelemetry;
}

export interface DevServer {
	address: AddressInfo;
	watcher: vite.FSWatcher;
	stop(): Promise<void>;
}

/** `astro dev` */
export default async function dev(config: AstroConfig, options: DevOptions): Promise<DevServer> {
	const devStart = performance.now();
	applyPolyfill();
	await options.telemetry.record([]);
	config = await runHookConfigSetup({ config, command: 'dev' });
	const { host, port } = config.server;

	// load client runtime scripts ahead-of-time to fix "isSelfAccepting" bug during HMR
	const clientRuntimeScripts = await glob(
		new URL('../../runtime/client/*.js', import.meta.url).pathname
	);
	const clientRuntimeFilePaths = clientRuntimeScripts
		.map((script) => `astro/client/${path.basename(script)}`)
		// fixes duplicate dependency issue in monorepo when using astro: "workspace:*"
		.filter((filePath) => filePath !== 'astro/client/hmr.js');
	const viteConfig = await createVite(
		{
			mode: 'development',
			server: { host },
			optimizeDeps: {
				include: clientRuntimeFilePaths,
			},
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
	if (viteConfig.server?.fs?.strict === false) {
		warn(options.logging, null, msg.fsStrictWarning());
	}

	await runHookServerStart({ config, address: devServerAddressInfo });

	return {
		address: devServerAddressInfo,
		get watcher() {
			return viteServer.watcher;
		},
		stop: async () => {
			await viteServer.close();
			await runHookServerDone({ config });
		},
	};
}
