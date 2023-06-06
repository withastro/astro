import type { AstroConfig } from '../@types/astro';

export function isServerLikeOutput(config: AstroConfig) {
	return config.output === 'server' || config.output === 'hybrid';
}

export function getPrerenderDefault(config: AstroConfig) {
	return config.output === 'hybrid';
}
