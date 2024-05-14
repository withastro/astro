import { loadEnv } from 'vite';

export function getAstroStudioEnv(envMode = ''): Record<`ASTRO_STUDIO_${string}`, string> {
	const env = loadEnv(envMode, process.cwd(), 'ASTRO_STUDIO_');
	return env;
}

export function getAstroStudioUrl(): string {
	const env = getAstroStudioEnv();
	return env.ASTRO_STUDIO_URL || 'https://studio.astro.build';
}

/**
 * Small wrapper around fetch that throws an error if the response is not OK. Allows for custom error handling as well through the onNotOK callback.
 */
export async function safeFetch(
	url: Parameters<typeof fetch>[0],
	options: Parameters<typeof fetch>[1] = {},
	onNotOK: (response: Response) => void | Promise<void> = () => {
		throw new Error(`Request to ${url} returned a non-OK status code.`);
	}
): Promise<Response> {
	const response = await fetch(url, options);

	if (!response.ok) {
		await onNotOK(response);
	}

	return response;
}
