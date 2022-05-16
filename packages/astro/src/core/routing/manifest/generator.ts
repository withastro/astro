import type { AstroConfig, RoutePart } from '../../../@types/astro';

import { compile } from 'path-to-regexp';

export function getRouteGenerator(
	segments: RoutePart[][],
	addTrailingSlash: AstroConfig['trailingSlash']
) {
	const template = segments
		.map((segment) => {
			return segment[0].spread
				? `/:${segment[0].content.slice(3)}(.*)?`
				: '/' +
						segment
							.map((part) => {
								if (part)
									return part.dynamic
										? `:${part.content}`
										: part.content
												.normalize()
												.replace(/\?/g, '%3F')
												.replace(/#/g, '%23')
												.replace(/%5B/g, '[')
												.replace(/%5D/g, ']')
												.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
							})
							.join('');
		})
		.join('');

	const trailing = addTrailingSlash !== 'never' && segments.length ? '/' : '';
	const toPath = compile(template + trailing);
	return toPath;
}
