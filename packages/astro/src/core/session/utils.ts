import { builtinDrivers } from 'unstorage';
import type { SessionDriverConfig } from './types.js';
import type { SSRManifestSession } from '../app/types.js';
import type { AstroConfig } from '../../types/public/index.js';

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

export function sessionConfigToManifest(
	config: AstroConfig['session'],
): SSRManifestSession | undefined {
	if (!config) {
		return undefined;
	}

	const driver = normalizeSessionDriverConfig(config.driver);

	return {
		driverName: driver.name,
		options: driver.options,
		cookie: config.cookie,
		ttl: config.ttl,
	};
}
