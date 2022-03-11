import type { AstroConfig } from '../../@types/astro';

const localIps = new Set(['localhost', '127.0.0.1']);

/** Pad string () */
export function pad(input: string, minLength: number, dir?: 'left' | 'right'): string {
	let output = input;
	while (output.length < minLength) {
		output = dir === 'left' ? ' ' + output : output + ' ';
	}
	return output;
}

export function emoji(char: string, fallback: string) {
	return process.platform !== 'win32' ? char : fallback;
}

// TODO: remove once --hostname is baselined
export function getResolvedHostForVite(config: AstroConfig) {
	if (config.devOptions.host === false && config.devOptions.hostname !== 'localhost') {
		return config.devOptions.hostname;
	} else {
		return config.devOptions.host;
	}
}

export function getLocalAddress(serverAddress: string, config: AstroConfig): string {
	// TODO: remove once --hostname is baselined
	const host = getResolvedHostForVite(config);
	if (typeof host === 'boolean' || localIps.has(host) || serverAddress === '0.0.0.0') {
		return 'localhost';
	} else {
		return serverAddress;
	}
}

export function shouldNetworkBeExposed(config: AstroConfig) {
	// TODO: remove once --hostname is baselined
	const host = getResolvedHostForVite(config);
	// true - Vite exposes server on default network
	// non-local string - Vite exposes server on specified network
	return host === true || (typeof host === 'string' && !localIps.has(host));
}
