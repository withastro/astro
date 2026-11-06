export class NotFoundError extends Error {
	title?: string;

	constructor(message?: string, title?: string) {
		super(message);
		this.name = 'NotFoundError';
		this.title = title;
	}
}

/**
 * Throws a `NotFoundError` to trigger a 404 response in Astro routes, endpoints, or middleware.
 */
export function notFound(message?: string, title?: string): never {
	throw new NotFoundError(message, title);
}
