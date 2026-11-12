import nodePath from 'node:path';
import {
	isRemotePath,
	removeLeadingForwardSlash,
	appendForwardSlash,
	removeTrailingForwardSlash,
} from '@astrojs/internal-helpers/path';
import type { Redirect } from '@vercel/routing-utils';
import type { AstroConfig, IntegrationResolvedRoute, RoutePart } from 'astro';

const pathJoin = nodePath.posix.join;

// Copied from astro/packages/astro/src/core/routing/manifest/create.ts
// Disable eslint as we're not sure how to improve this regex yet
// eslint-disable-next-line regexp/no-super-linear-backtracking
const ROUTE_DYNAMIC_SPLIT = /\[(.+?\(.+?\)|.+?)\]/;
const ROUTE_SPREAD = /^\.{3}.+$/;
function getParts(part: string, file: string) {
	const result: RoutePart[] = [];
	part.split(ROUTE_DYNAMIC_SPLIT).map((str, i) => {
		if (!str) return;
		const dynamic = i % 2 === 1;

		const [, content] = dynamic ? /([^(]+)$/.exec(str) || [null, null] : [null, str];

		if (!content || (dynamic && !/^(?:\.\.\.)?[\w$]+$/.test(content))) {
			throw new Error(`Invalid route ${file} — parameter name must match /^[a-zA-Z0-9_$]+$/`);
		}

		result.push({
			content,
			dynamic,
			spread: dynamic && ROUTE_SPREAD.test(content),
		});
	});

	return result;
}
/**
 * Convert Astro routes into Vercel path-to-regexp syntax, which are the input for getTransformedRoutes
 */
function getMatchPattern(segments: RoutePart[][]) {
	return segments
		.map((segment) => {
			return segment
				.map((part) => {
					if (part.spread) {
						// Extract parameter name from spread syntax (e.g., "...slug" -> "slug")
						const paramName = part.content.startsWith('...') ? part.content.slice(3) : part.content;
						return `:${paramName}*`;
					}
					if (part.dynamic) {
						return `:${part.content}`;
					}
					return part.content;
				})
				.join('');
		})
		.join('/');
}

// Copied from /home/juanm04/dev/misc/astro/packages/astro/src/core/routing/manifest/create.ts
// 2022-04-26
function getMatchRegex(segments: RoutePart[][]) {
	return segments
		.map((segment, segmentIndex) => {
			return segment.length === 1 && segment[0].spread
				? '(?:\\/(.*?))?'
				: // Omit leading slash if segment is a spread.
					// This is handled using a regex in Astro core.
					// To avoid complex data massaging, we handle in-place here.
					(segmentIndex === 0 ? '' : '/') +
						segment
							.map((part) => {
								if (part)
									return part.spread
										? '(.*?)'
										: part.dynamic
											? '([^/]+?)'
											: part.content
													.normalize()
													.replace(/\?/g, '%3F')
													.replace(/#/g, '%23')
													.replace(/%5B/g, '[')
													.replace(/%5D/g, ']')
													.replace(/[*+?^${}()|[\]\\]/g, '\\$&');
							})
							.join('');
		})
		.join('');
}

function getRedirectLocation(route: IntegrationResolvedRoute, config: AstroConfig): string {
	if (route.redirectRoute) {
		const pattern = getMatchPattern(route.redirectRoute.segments);
		return pathJoin(config.base, pattern);
	}

	const destination =
		typeof route.redirect === 'object' ? route.redirect.destination : (route.redirect ?? '');

	if (isRemotePath(destination)) {
		return destination;
	}

	return pathJoin(config.base, destination);
}

function getRedirectStatus(route: IntegrationResolvedRoute): number {
	if (typeof route.redirect === 'object') {
		return route.redirect.status;
	}
	return 301;
}

export function escapeRegex(content: string) {
	const segments = removeLeadingForwardSlash(content)
		.split(nodePath.posix.sep)
		.filter(Boolean)
		.map((s: string) => {
			return getParts(s, content);
		});
	return `^/${getMatchRegex(segments)}$`;
}

/**
 * Vercel's `trailingSlash: true` normalizer appends a slash only when the last
 * path segment contains no dot (`^/((?:[^/]+/)*[^/\.]+)$`). Paths with a dot
 * are left untouched, unless they end in an extension and already carry a
 * slash. So a source must stay unslashed whenever its last segment has a dot.
 */
const LAST_SEGMENT_HAS_DOT = /\.[^/]*$/;

/**
 * Adjust a Vercel redirect source for the Astro `trailingSlash` config.
 * With `trailingSlash: 'always'` Vercel normalizes `/old` to `/old/` before
 * redirects run, so an unslashed source can never match. Append a slash except
 * for the root and dotted paths, which Vercel leaves unslashed even when
 * `trailingSlash` is enabled.
 */
export function adjustSourceForTrailingSlash(
	source: string,
	trailingSlash: AstroConfig['trailingSlash'],
): string {
	if (trailingSlash === 'always') {
		if (source === '/' || source.endsWith('/')) {
			return source;
		}
		if (LAST_SEGMENT_HAS_DOT.test(source)) {
			return source;
		}
		return appendForwardSlash(source);
	}
	if (trailingSlash === 'never') {
		if (source === '/') {
			return source;
		}
		return removeTrailingForwardSlash(source);
	}
	return source;
}

/**
 * Whether the last route segment only resolves at request time. Vercel's
 * normalizer skips such a path when the resolved value contains a dot, and
 * appends a slash when it doesn't, so both forms have to match.
 */
function endsWithDynamicSegment(segments: RoutePart[][]): boolean {
	const lastSegment = segments.at(-1);
	return lastSegment?.some((part) => part.dynamic) ?? false;
}

export function getRedirects(routes: IntegrationResolvedRoute[], config: AstroConfig): Redirect[] {
	const redirects: Redirect[] = [];

	for (const route of routes) {
		if (route.type !== 'redirect') {
			continue;
		}

		const destination = getRedirectLocation(route, config);
		const statusCode = getRedirectStatus(route);
		const pattern = config.base + getMatchPattern(route.segments);

		if (config.trailingSlash === 'always' && endsWithDynamicSegment(route.segments)) {
			// The resolved value may or may not contain a dot, so keep a rule for
			// both the slashed and the unslashed form.
			for (const source of new Set([
				appendForwardSlash(pattern),
				removeTrailingForwardSlash(pattern),
			])) {
				redirects.push({ source, destination, statusCode });
			}
			continue;
		}

		redirects.push({
			source: adjustSourceForTrailingSlash(pattern, config.trailingSlash),
			destination,
			statusCode,
		});
	}
	return redirects;
}
