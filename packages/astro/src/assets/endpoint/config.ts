import type { AstroSettings } from '../../types/astro.js';

export function injectImageEndpoint(settings: AstroSettings, mode: 'dev' | 'build') {
	const endpointEntrypoint =
		settings.config.image.endpoint.entrypoint === 'default'
			? mode === 'dev'
				? 'astro/assets/endpoint/node'
				: 'astro/assets/endpoint/generic'
			: settings.config.image.endpoint.entrypoint;

	settings.injectedRoutes.push({
		pattern: settings.config.image.endpoint.route,
		entrypoint: endpointEntrypoint,
		prerender: false,
	});

	return settings;
}
