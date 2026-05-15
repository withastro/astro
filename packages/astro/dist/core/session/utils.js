import { builtinDrivers } from 'unstorage';
import { fileURLToPath } from 'node:url';
function isUnstorageDriver(driver) {
	return driver in builtinDrivers;
}
function normalizeSessionDriverConfig(driver, options) {
	if (typeof driver !== 'string') {
		return {
			entrypoint:
				driver.entrypoint instanceof URL ? fileURLToPath(driver.entrypoint) : driver.entrypoint,
			config: driver.config,
		};
	}
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
function sessionConfigToManifest(config) {
	const sessionDriver = config?.driver;
	if (!config || !sessionDriver) {
		return void 0;
	}
	const driver = normalizeSessionDriverConfig(sessionDriver);
	return {
		driver: driver.entrypoint,
		options: driver.config,
		cookie: config.cookie,
		ttl: config.ttl,
	};
}
export { normalizeSessionDriverConfig, sessionConfigToManifest };
