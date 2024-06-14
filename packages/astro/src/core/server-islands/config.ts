import type { AstroSettings } from '../../@types/astro.js';

export function injectServerIslandEndpoint(settings: AstroSettings) {
	settings.injectedRoutes.push({
		pattern: '/_server-islands/[name]',
		entrypoint: 'astro/components/_ServerIslandRenderer.astro',
	});

	return settings;
}
