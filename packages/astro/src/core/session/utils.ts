import { builtinDrivers } from 'unstorage';
import type { NormalizedSessionDriverConfig, SessionDriverConfig } from './types.js';
import type { SSRManifestSession } from '../app/types.js';
import type { AstroConfig } from '../../types/public/index.js';
import { fileURLToPath } from 'node:url';

function isUnstorageDriver(driver: string): driver is keyof typeof builtinDrivers {
	return driver in builtinDrivers;
}

export function normalizeSessionDriverConfig(
	driver: string | SessionDriverConfig,
	/** @deprecated */
	options?: Record<string, any>,
): NormalizedSessionDriverConfig {
	if (typeof driver !== 'string') {
		return {
			entrypoint:
				driver.entrypoint instanceof URL ? fileURLToPath(driver.entrypoint) : driver.entrypoint,
			config: driver.config,
		};
	}

	// The fs driver cannot be bundled so we special case it
	if (['fs', 'fs-lite', 'fsLite'].includes(driver)) {
		return {
			entrypoint: builtinDrivers.fsLite,
			config: {
				base: '.astro/session',
				...options,
			},
		};
	}

	if (isUnstorageDriver(driver)) {
		return {
			entrypoint: builtinDrivers[driver],
			config: options,
		};
	}

	return {
		entrypoint: driver,
		config: options,
	};
}

export function sessionConfigToManifest(
	config: AstroConfig['session'],
): SSRManifestSession | undefined {
	const sessionDriver = config?.driver;
	if (!config || !sessionDriver) {
		return undefined;
	}

	const driver = normalizeSessionDriverConfig(sessionDriver);

	return {
		driver: driver.entrypoint,
		options: driver.config,
		cookie: config.cookie,
		ttl: config.ttl,
	};
}
