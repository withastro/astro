import type { z } from 'astro/zod';
import type { RSSOptions } from './index';

/** Normalize URL to its canonical form */
export function createCanonicalURL(
	url: string,
	trailingSlash?: RSSOptions['trailingSlash'],
	base?: string
): URL {
	let pathname = url.replace(/\/index.html$/, ''); // index.html is not canonical
	if (trailingSlash === false) {
		// remove the trailing slash
		pathname = pathname.replace(/(\/+)?$/, '');
	} else if (!getUrlExtension(url)) {
		// add trailing slash if there’s no extension or `trailingSlash` is true
		pathname = pathname.replace(/(\/+)?$/, '/');
	}

	pathname = pathname.replace(/\/+/g, '/'); // remove duplicate slashes (URL() won’t)
	return new URL(pathname, base);
}

/** Check if a URL is already valid */
export function isValidURL(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch (e) {}
	return false;
}

function getUrlExtension(url: string) {
	const lastDot = url.lastIndexOf('.');
	const lastSlash = url.lastIndexOf('/');
	return lastDot > lastSlash ? url.slice(lastDot + 1) : '';
}

const flattenErrorPath = (errorPath: (string | number)[]) => errorPath.join('.');

export const errorMap: z.ZodErrorMap = (error, ctx) => {
	if (error.code === 'invalid_type') {
		const badKeyPath = JSON.stringify(flattenErrorPath(error.path));
		if (error.received === 'undefined') {
			return { message: `${badKeyPath} is required.` };
		} else {
			return { message: `${badKeyPath} should be ${error.expected}, not ${error.received}.` };
		}
	}
	return { message: ctx.defaultError };
};
