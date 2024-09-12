import type { AstroConfig, RoutePart } from '../../../@types/astro.js';

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
	addTrailingSlash: AstroConfig['trailingSlash'],
) {
	return (params: Record<string, string | number | undefined>): string => {
		const sanitizedParams = sanitizeParams(params);

		// Unless trailingSlash config is set to 'always', don't automatically append it.
		let trailing: '/' | '' = '';
		if (addTrailingSlash === 'always' && segments.length) {
			trailing = '/';
		}

		const path = segments
			.map((segment) => {
				return (
					'/' +
					segment
						.map((part) => {
							if (part.spread) {
								return `${sanitizedParams[part.content.slice(3)] || ''}`;
							} else if (part.dynamic) {
								return `${sanitizedParams[part.content] || ''}`;
							} else {
								return part.content
									.normalize()
									.replace(/\?/g, '%3F')
									.replace(/#/g, '%23')
									.replace(/%5B/g, '[')
									.replace(/%5D/g, ']');
							}
						})
						.join('')
				);
			})
			.join('') + trailing;

		return path || '/';
	};
}
