import { tryGetAmbientManifest } from '../manifest/ambient.js';
import type { AstroLogger } from './core.js';
import { createConsoleLogger } from './impls/console.js';
import { getLogger } from './manifest-logger.js';

export function getGlobalLogger(): AstroLogger {
	const manifest = tryGetAmbientManifest();
	if (manifest) {
		return getLogger(manifest);
	}
	return createConsoleLogger({ level: 'info' });
}
