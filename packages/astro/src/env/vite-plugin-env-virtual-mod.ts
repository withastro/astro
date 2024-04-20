import type { Plugin } from 'vite';
import type { AstroSettings } from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';

interface AstroEnvVirtualModPluginParams {
	settings: AstroSettings;
	logger: Logger;
}

export function astroEnvVirtualModPlugin({
	settings,
	logger,
}: AstroEnvVirtualModPluginParams): Plugin | undefined {
	if (!settings.config.experimental.env) {
		return;
	}

	logger.warn('env', 'This feature is experimental. TODO:');

	const { schema } = settings.config.experimental.env;
	// TODO: client / public
	// TODO: server / public
	// TODO: server / secret
	return {
		name: 'astro-env-virtual-mod-plugin',
		enforce: 'pre',
	};
}
