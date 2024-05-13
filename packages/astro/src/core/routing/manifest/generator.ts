import type { AstroConfig, RoutePart } from '../../../@types/astro.js';

import { compile } from 'path-to-regexp';

function sanitizePath(path: string) {
	return path.normalize()
		.replace(/\?/g, "%3F")
		.replace(/#/g, "%23")
		.replace(/%5B/g, "[")
		.replace(/%5D/g, "]")
		.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function sanitizeParams(params: Record<string, string | number | undefined>): Record<string, string | number | undefined> {
	return Object.entries(params).reduce((acc, [key, value]) => {
		if (typeof value === "string") {
			acc[key] = sanitizePath(value);
		} else {
			acc[key] = value;
		}
		return acc;
	}, {} as Record<string, string | number | undefined>);
}

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
							return sanitizePath(part.content)
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
