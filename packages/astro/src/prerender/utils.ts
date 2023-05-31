// TODO: remove after the experimetal phase when

import type { AstroConfig } from '../@types/astro';

export function isHybridMalconfigured(config: AstroConfig) {
	return config.experimental.hybridOutput ? config.output !== 'hybrid' : config.output === 'hybrid';
}

export function isHybridOutput(config: AstroConfig) {
	return config.experimental.hybridOutput && config.output === 'hybrid';
}
