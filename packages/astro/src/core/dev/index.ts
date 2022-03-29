import type { AddressInfo } from 'net';
import { performance } from 'perf_hooks';
import * as vite from 'vite';
import type { AstroConfig } from '../../@types/astro';
import { runHookConfigDone, runHookConfigSetup, runHookServerDone, runHookServerSetup, runHookServerStart } from '../../integrations/index.js';
import { createVite } from '../create-vite.js';
import { defaultLogOptions, info, LogOptions, warn, warnIfUsingExperimentalSSR } from '../logger.js';
import * as msg from '../messages.js';
import { apply as applyPolyfill } from '../polyfill.js';
import { getResolvedHostForVite } from '../util.js';

export interface DevOptions {
	logging: LogOptions;
}

export interface DevServer {
	address: AddressInfo;
	stop(): Promise<void>;
}

/** `astro dev` */
export default async function dev(config: AstroConfig, options: DevOptions = { logging: defaultLogOptions }): Promise<DevServer> {
	const devStart = performance.now();
	applyPolyfill();
	config = await runHookConfigSetup({ config, command: 'dev' });
	const viteConfig = await createVite(
		{
			mode: 'development',
			// TODO: remove call once --hostname is baselined
			server: { host: getResolvedHostForVite(config) },
		},
		{ astroConfig: config, logging: options.logging, mode: 'dev' }
	);
	await runHookConfigDone({ config });
	warnIfUsingExperimentalSSR(options.logging, config);
	const viteServer = await vite.createServer(viteConfig);
	runHookServerSetup({ config, server: viteServer });
	await viteServer.listen(config.devOptions.port);

	const devServerAddressInfo = viteServer.httpServer!.address() as AddressInfo;
	const site = config.buildOptions.site ? new URL(config.buildOptions.site) : undefined;
	info(options.logging, null, msg.devStart({ startupTime: performance.now() - devStart, config, devServerAddressInfo, site, https: !!viteConfig.server?.https }));

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
