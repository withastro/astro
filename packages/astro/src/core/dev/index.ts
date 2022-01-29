import { polyfill } from '@astropub/webapi';
import type { AddressInfo } from 'net';
import { performance } from 'perf_hooks';
import type { AstroConfig } from '../../@types/astro';
import { createVite } from '../create-vite.js';
import { defaultLogOptions, info, LogOptions } from '../logger.js';
import vite from '../vite.js';
import * as msg from '../messages.js';

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
	// polyfill WebAPIs for Node.js runtime
	polyfill(globalThis, {
		exclude: 'window document',
	});
	// start the server
	const viteUserConfig = vite.mergeConfig({ mode: 'development' }, config.vite || {});
	const viteConfig = await createVite(viteUserConfig, { astroConfig: config, logging: options.logging });
	const viteServer = await vite.createServer(viteConfig);
	await viteServer.listen(config.devOptions.port);
	const address = viteServer.httpServer!.address() as AddressInfo;
	// Log to console
	const site = config.buildOptions.site ? new URL(config.buildOptions.site) : undefined;
	info(options.logging, 'astro', msg.devStart({ startupTime: performance.now() - devStart }));
	info(options.logging, 'astro', msg.devHost({ address, site, https: !!viteUserConfig.server?.https }));

	return {
		address,
		stop: () => viteServer.close(),
	};
}
