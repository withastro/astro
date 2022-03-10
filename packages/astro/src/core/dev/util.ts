import type { AstroConfig } from '../../@types/astro';

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
	if (typeof host === 'boolean' || host === 'localhost' || serverAddress === '127.0.0.1' || serverAddress === '0.0.0.0') {
		return 'localhost';
	} else {
		return serverAddress;
	}
}

export function shouldNetworkBeExposed(config: AstroConfig) {
	// TODO: remove once --hostname is baselined
	const host = getResolvedHostForVite(config);
	return host === true || typeof host === 'string';
}
