import type { AstroConfig } from '../../types/public/config.js';
import type { RoutePart } from '../../types/public/internal.js';

export function getPattern(
	segments: RoutePart[][],
	base: AstroConfig['base'],
	addTrailingSlash: AstroConfig['trailingSlash'],
) {
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

	const trailing =
		addTrailingSlash && segments.length ? getTrailingSlashPattern(addTrailingSlash) : '$';
	let initial = '\\/';
	if (addTrailingSlash === 'never' && base !== '/') {
		initial = '';
	}
	return new RegExp(`^${pathname || initial}${trailing}`);
}

/**
 * Generates a standard route path from parsed route segments.
 *
 * Translates Astro's segment-based route definitions to standard HTTP
 * router path syntax (used by Express, Hono, Fastify, etc.):
 * - `[slug]` → `:slug`
 * - `[...rest]` → `*`
 * - static segments are passed through as-is
 */
export function getRoutePath(segments: RoutePart[][], base: AstroConfig['base']): string {
	const normalizedBase = base === '/' ? '' : base.replace(/\/$/, '');
	if (segments.length === 0) {
		return normalizedBase + '/';
	}

	const path = segments
		.map((segment) => {
			if (segment.length === 1 && segment[0].spread) {
				return '*';
			}
			return segment
				.map((part) => {
					if (part.spread) return '*';
					if (part.dynamic) return `:${part.content}`;
					return part.content;
				})
				.join('');
		})
		.join('/');

	return `${normalizedBase}/${path}`;
}

function getTrailingSlashPattern(addTrailingSlash: AstroConfig['trailingSlash']): string {
	if (addTrailingSlash === 'always') {
		return '\\/$';
	}
	if (addTrailingSlash === 'never') {
		return '$';
	}
	return '\\/?$';
}
