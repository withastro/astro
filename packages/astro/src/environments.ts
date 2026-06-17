import type { Environment } from 'vite';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from './core/constants.js';

export function isAstroServerEnvironment(environment: Environment) {
	return (
		environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
		environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender ||
		environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro
	);
}

export function isAstroClientEnvironment(environment: Environment) {
	return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client;
}
