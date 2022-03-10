import type { AstroConfig } from '../../@types/astro';

export function getResolvedHostForHttpServer(config: AstroConfig) {
	const { host, hostname } = config.devOptions;

	if (host === false && hostname === 'localhost') {
		// Use a secure default
		return '127.0.0.1';
	} else if (host === true) {
		// If passed --host in the CLI without arguments
		return undefined; // undefined typically means 0.0.0.0 or :: (listen on all IPs)
	} else if (typeof host === 'string') {
		return host;
	} else {
		return hostname;
	}
}
