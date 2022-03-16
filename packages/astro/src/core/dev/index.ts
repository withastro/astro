import type { AstroConfig } from '../../@types/astro';
import type { AddressInfo } from 'net';

import { performance } from 'perf_hooks';
import { apply as applyPolyfill } from '../polyfill.js';
import { createVite } from '../create-vite.js';
import { defaultLogOptions, info, warn, LogOptions } from '../logger.js';
import * as vite from 'vite';
import * as msg from '../messages.js';
import { getResolvedHostForVite } from './util.js';

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

	// TODO: remove call once --hostname is baselined
	const host = getResolvedHostForVite(config);
	const viteUserConfig = vite.mergeConfig(
		{
			mode: 'development',
			server: { host },
		},
		config.vite || {}
	);
	const viteConfig = await createVite(viteUserConfig, { astroConfig: config, logging: options.logging, mode: 'dev' });
	const viteServer = await vite.createServer(viteConfig);
	await viteServer.listen(config.devOptions.port);

	const devServerAddressInfo = viteServer.httpServer!.address() as AddressInfo;
	const site = config.buildOptions.site ? new URL(config.buildOptions.site) : undefined;
	info(options.logging, null, msg.devStart({ startupTime: performance.now() - devStart, config, devServerAddressInfo, site, https: !!viteUserConfig.server?.https }));

	const currentVersion = process.env.PACKAGE_VERSION ?? '0.0.0';
	if (currentVersion.includes('-')) {
		warn(options.logging, null, msg.prerelease({ currentVersion }));
	}

	return {
		address: devServerAddressInfo,
		stop: () => viteServer.close(),
	};
}
