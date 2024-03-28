import nodePath from 'node:path';
import { appendForwardSlash, removeLeadingForwardSlash } from '@astrojs/internal-helpers/path';
import type { AstroConfig, RouteData, RoutePart } from 'astro';

const pathJoin = nodePath.posix.join;

// https://vercel.com/docs/project-configuration#legacy/routes
interface VercelRoute {
	src: string;
	methods?: string[];
	dest?: string;
	headers?: Record<string, string>;
	status?: number;
	continue?: boolean;
}

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

// Copied from /home/juanm04/dev/misc/astro/packages/astro/src/core/routing/manifest/create.ts
// 2022-04-26
function getMatchPattern(segments: RoutePart[][]) {
	return segments
		.map((segment) => {
			return segment[0].spread
				? '(?:\\/(.*?))?'
				: segment
						.map((part) => {
							if (part)
								return part.dynamic
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
		.join('/');
}

function getReplacePattern(segments: RoutePart[][]) {
	let n = 0;
	let result = '';

	for (const segment of segments) {
		for (const part of segment) {
			if (part.dynamic) result += '$' + ++n;
			else result += part.content;
		}
		result += '/';
	}

	// Remove trailing slash
	result = result.slice(0, -1);

	return result;
}

function getRedirectLocation(route: RouteData, config: AstroConfig): string {
	if (route.redirectRoute) {
		const pattern = getReplacePattern(route.redirectRoute.segments);
		const path = config.trailingSlash === 'always' ? appendForwardSlash(pattern) : pattern;
		return pathJoin(config.base, path);
	} else if (typeof route.redirect === 'object') {
		return pathJoin(config.base, route.redirect.destination);
	} else {
		return pathJoin(config.base, route.redirect || '');
	}
}

function getRedirectStatus(route: RouteData): number {
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
	return `^/${getMatchPattern(segments)}$`;
}

export function getRedirects(routes: RouteData[], config: AstroConfig): VercelRoute[] {
	let redirects: VercelRoute[] = [];

	for (const route of routes) {
		if (route.type === 'redirect') {
			redirects.push({
				src: config.base + getMatchPattern(route.segments),
				headers: { Location: getRedirectLocation(route, config) },
				status: getRedirectStatus(route),
			});
		} else if (route.type === 'page' && route.route !== '/') {
			if (config.trailingSlash === 'always') {
				redirects.push({
					src: config.base + getMatchPattern(route.segments),
					headers: { Location: config.base + getReplacePattern(route.segments) + '/' },
					status: 308,
				});
			} else if (config.trailingSlash === 'never') {
				redirects.push({
					src: config.base + getMatchPattern(route.segments) + '/',
					headers: { Location: config.base + getReplacePattern(route.segments) },
					status: 308,
				});
			}
		}
	}

	return redirects;
}
