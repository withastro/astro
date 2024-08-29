import type { AstroConfig } from 'astro';

export function isServerLikeOutput(config: AstroConfig) {
	return config.output === 'server' || config.output === 'hybrid';
}
