import type { MiddlewareHandler } from '../../@types/astro.js';

interface MiddewareOptions {
	filterContentType?: (contentType: string) => boolean;
	// @ts-ignore
	excludeKeys?: Array<keyof Omit<typeof import('astro:env/server'), 'getSecret'>>;
}

export function leakDetectionMiddleware({
	filterContentType = (v) => v.startsWith('text/') || v.startsWith('application/json'),
	excludeKeys = [],
}: MiddewareOptions = {}): MiddlewareHandler {
	return async (_, next) => {
		const response = await next();

		const contentType = response.headers.get('Content-Type');
		if (contentType && filterContentType(contentType)) {
			const content = await response.clone().text();
			const { getSecret, ...secrets }: Record<string, string | undefined> = await import(
				// @ts-ignore
				'astro:env/server'
			);
			for (const [key, value] of Object.entries(secrets)) {
				if (excludeKeys.includes(key) || value === undefined) {
					continue;
				}
				if (content.includes(value)) {
					throw new Error(`[astro:env] \`${key}\` leaked client-side.`);
				}
			}
		}

		return response;
	};
}
