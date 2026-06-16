export const ASTRO_VITE_ENVIRONMENT_NAMES = {
	ssr: 'ssr',
	client: 'client',
	astro: 'astro',
	prerender: 'prerender',
} as const;

export type AstroEnvironmentNames =
	(typeof ASTRO_VITE_ENVIRONMENT_NAMES)[keyof typeof ASTRO_VITE_ENVIRONMENT_NAMES];

export function isAstroServerEnvironment(environment: { name: string }): boolean {
	return (
		environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
		environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender ||
		environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro
	);
}

export function isAstroClientEnvironment(environment: { name: string }): boolean {
	return environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.client;
}
