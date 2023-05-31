import type { AstroConfig } from 'astro';

export function isHybridOutput(config: AstroConfig) {
	return config.experimental.hybridOutput && config.output === 'hybrid';
}
