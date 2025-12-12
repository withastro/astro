import { builtinDrivers } from 'unstorage';
import type { SessionDriverConfig } from './types.js';

export function normalizeSessionDriverConfig(
	driver: string | SessionDriverConfig,
	/** @deprecated */
	options?: Record<string, any>,
): SessionDriverConfig {
	if (typeof driver !== 'string') {
		return driver;
	}

	if (driver in builtinDrivers) {
		if (driver === 'fs') {
			driver = 'fsLite';
		}
		return {
			name: driver,
			entrypoint: builtinDrivers[driver as keyof typeof builtinDrivers],
			options: {
				base: '.astro/session',
				...options,
			},
		};
	}

	return {
		name: 'custom',
		entrypoint: driver,
		options,
	};
}
