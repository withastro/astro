import type { AstroConfig, RoutePart } from '../../../@types/astro.js';

import { compile } from 'path-to-regexp';

export function getRouteGenerator(
	segments: RoutePart[][],
	addTrailingSlash: AstroConfig['trailingSlash']
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
	return (params: object): string => {
		const path = toPath(params);

		// When generating an index from a rest parameter route, `path-to-regexp` will return an
		// empty string instead "/". This causes an inconsistency with static indexes that may result
		// in the incorrect routes being rendered.
		// To fix this, we return "/" when the path is empty.
		return path || '/';
	};
}
