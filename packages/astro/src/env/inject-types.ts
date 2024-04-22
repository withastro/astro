import type { AstroSettings } from '../@types/astro.js';
import { ENV_TYPES_FILE } from './constants.js';

export function injectEnvTypes({ settings }: { settings: AstroSettings }) {
	if (!settings.config.experimental.env) {
		return settings;
	}

	settings.injectedTypes.push({
		filename: ENV_TYPES_FILE,
	});

	return settings;
}
