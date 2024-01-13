import type { AstroSettings } from '../../@types/astro.js';

export function injectImageEndpoint(settings: AstroSettings, mode: 'dev' | 'build') {
	const endpointEntrypoint =
		settings.config.image.endpoint ??
		(mode === 'dev' ? 'astro/assets/endpoint/node' : 'astro/assets/endpoint/generic');

	settings.injectedRoutes.push({
		pattern: '/_image',
		entrypoint: endpointEntrypoint,
		prerender: false,
	});

	return settings;
}
