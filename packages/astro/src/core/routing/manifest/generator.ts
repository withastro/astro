import type { AstroConfig, RoutePart } from '../../../@types/astro.js';
import { compile } from 'path-to-regexp';

/**
 * Sanitizes the parameters object by normalizing string values, replacing certain characters with their URL-encoded equivalents,
 * and retaining arrays for spread parameters (e.g., `slug`).
 * 
 * @param {Record<string, string | number | string[] | undefined>} params - The parameters object to be sanitized, which may include strings, numbers, arrays, or undefined values.
 * @returns {Record<string, string | number | string[] | undefined>} The sanitized parameters object with normalized strings and preserved arrays.
 */
function sanitizeParams(
	params: Record<string, string | number | string[] | undefined>,
): Record<string, string | number  | undefined> {
	return Object.fromEntries(
		Object.entries(params).map(([key, value]) => {
			if (Array.isArray(value)) {
			// Keep the array as is for spread parameters (e.g., `slug`)
			return [key,value];
			} else if (typeof value === 'string') {
				// Only call normalize on strings
				return [key, value.normalize().replace(/#/g, '%23').replace(/\?/g, '%3F')];
			} else {
				return [key, value];
			}
		}),
	);
}

export function getRouteGenerator(
	segments: RoutePart[][],
	addTrailingSlash: AstroConfig['trailingSlash'],
) {
	const template = segments
		.map((segment) => {
			return (
				'/' +
				segment
					.map((part) => {
						if (part.spread) {
							return `*${part.content.slice(3)}`;
						} else if (part.dynamic) {
							return `:${part.content}`;
						} else {
							return part.content
								.normalize()
								.replace(/\?/g, '%3F')
								.replace(/#/g, '%23')
								.replace(/%5B/g, '[')
								.replace(/%5D/g, ']')
								.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
						}
					})
					.join('')
			);
		})
		.join('');

	let trailing: '/' | '' = '';
	if (addTrailingSlash === 'always' && segments.length) {
		trailing = '/';
	}
	const toPath = compile(template + trailing);
	return (params: Record<string, string[] | number | undefined>): string => {

		// Convert `slug` to an array if it's a string
		if (typeof params.slug === 'string') {
			params.slug = [params.slug];
		}
		
		const sanitizedParams = sanitizeParams(params);
		const path = toPath(sanitizedParams);

		// When generating an index from a rest parameter route, `path-to-regexp` will return an
		// empty string instead "/". This causes an inconsistency with static indexes that may result
		// in the incorrect routes being rendered.
		// To fix this, we return "/" when the path is empty.
		return path || '/';
	};
}
