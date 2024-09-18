import type { RoutePart } from '../../../types/public/internal.js';

export function getPattern(segments: RoutePart[][]) {
	const pathname = segments
		.map((segment) => {
			if (segment.length === 1 && segment[0].spread) {
				return '(?:\\/(.*?))?';
			} else {
				return (
					'\\/' +
					segment
						.map((part) => {
							if (part.spread) {
								return '(.*?)';
							} else if (part.dynamic) {
								return '([^/]+?)';
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
			}
		})
		.join('');

	// NOTE: Pattern should always assume `trailingSlash: 'ignore'` so it matches loosely and
	// later flows can determine the matched route type (page or endpoint) to enforce trailingSlash.
	return new RegExp(`^${pathname}\\/?$`);
}
