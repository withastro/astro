import type { MiddlewareHandler } from '../../@types/astro.js';

interface MiddewareOptions {
	/**
	 * Filters what response content type should trigger the check. Defaults to the content type
	 * starting with `/text` or `application/json` 
	 */
	filterContentType?: (contentType: string) => boolean;
	/**
	 * By default, all server environment variables are checked. However, you may have variables
	 * whose value is really likely to end up on the client but not because it leaked (eg. `test`).
	 * In this case, you can exclude those keys.
	 */
	// @ts-ignore
	excludeKeys?: Array<keyof Omit<typeof import('astro:env/server'), 'getSecret'>>;
}

/**
 * This middleware will throw if a response with the specified content type contains a server
 * environment variable.
 */
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
