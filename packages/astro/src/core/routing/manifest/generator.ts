import { compile } from 'path-to-regexp';
import type { AstroConfig } from '../../../types/public/config.js';
import type { RoutePart } from '../../../types/public/internal.js';

/**
 * Sanitizes the parameters object by normalizing string values and replacing certain characters with their URL-encoded equivalents.
 * @param {Record<string, string | number | undefined>} params - The parameters object to be sanitized.
 * @returns {Record<string, string | number | undefined>} The sanitized parameters object.
 */
function sanitizeParams(
	params: Record<string, string | number | undefined>,
): Record<string, string | number | undefined> {
	return Object.fromEntries(
		Object.entries(params).map(([key, value]) => {
			if (typeof value === 'string') {
				return [key, value.normalize().replace(/#/g, '%23').replace(/\?/g, '%3F')];
			}
			return [key, value];
		}),
	);
}

export function getRouteGenerator(
	segments: RoutePart[][],
	addTrailingSlash: AstroConfig['trailingSlash']['page'],
) {
	const template = segments
		.map((segment) => {
			return (
				'/' +
				segment
					.map((part) => {
						if (part.spread) {
							return `:${part.content.slice(3)}(.*)?`;
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

	// Unless trailingSlash config is set to 'always', don't automatically append it.
	let trailing: '/' | '' = '';
	if (addTrailingSlash === 'always' && segments.length) {
		trailing = '/';
	}
	const toPath = compile(template + trailing);
	return (params: Record<string, string | number | undefined>): string => {
		const sanitizedParams = sanitizeParams(params);
		const path = toPath(sanitizedParams);

		// When generating an index from a rest parameter route, `path-to-regexp` will return an
		// empty string instead "/". This causes an inconsistency with static indexes that may result
		// in the incorrect routes being rendered.
		// To fix this, we return "/" when the path is empty.
		return path || '/';
	};
}
