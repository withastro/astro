import { builtinDrivers } from 'unstorage';
import type { NormalizedSessionDriverConfig, SessionDriverConfig } from './types.js';
import type { SSRManifestSession } from '../app/types.js';
import type { AstroConfig } from '../../types/public/index.js';
import { fileURLToPath } from 'node:url';

export function normalizeSessionDriverConfig(
	driver: string | SessionDriverConfig,
	/** @deprecated */
	options?: Record<string, any>,
): NormalizedSessionDriverConfig {
	if (typeof driver !== 'string') {
		return {
			entrypoint:
				driver.entrypoint instanceof URL ? fileURLToPath(driver.entrypoint) : driver.entrypoint,
			options: driver.options,
		};
	}

	// The fs driver cannot be bundled so we special case it
	if (['fs', 'fs-lite', 'fsLite'].includes(driver)) {
		return {
			entrypoint: builtinDrivers.fsLite,
			options: {
				base: '.astro/session',
				...options,
			},
		};
	}

	if (driver in builtinDrivers) {
		return {
			entrypoint: builtinDrivers[driver as keyof typeof builtinDrivers],
			options,
		};
	}

	return {
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
		driver: driver.entrypoint,
		options: driver.options,
		cookie: config.cookie,
		ttl: config.ttl,
	};
}
