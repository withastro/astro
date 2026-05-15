import { ASTRO_VITE_ENVIRONMENT_NAMES } from './core/constants.js';
function isAstroServerEnvironment(environment) {
	return (
		environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
		environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender ||
		environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro
	);
}
function isAstroClientEnvironment(environment) {
	return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client;
}
export { isAstroClientEnvironment, isAstroServerEnvironment };
