import {
	AstroError,
	AstroErrorData,
} from '@astrojs/vite-plugin-astro/internal/core/errors/index.js';

export function getRedirectLocationOrThrow(headers: Headers): string {
	let location = headers.get('location');

	if (!location) {
		throw new AstroError({
			...AstroErrorData.RedirectWithNoLocation,
		});
	}

	return location;
}
