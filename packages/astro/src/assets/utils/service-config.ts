import type { ImageServiceConfig, ImageServiceTargets } from '../../types/public/config.js';
import type { ImageConfig } from '../services/service.js';

export function getImageServiceConfig(
	service: ImageServiceConfig | ImageServiceTargets,
	target: 'build' | 'runtime',
): ImageConfig['service'] {
	const resolved = 'runtime' in service ? service[target] : service;
	// The schema defaults `config` once, so a service set by an integration may not have it.
	return { ...resolved, config: resolved.config ?? {} };
}
