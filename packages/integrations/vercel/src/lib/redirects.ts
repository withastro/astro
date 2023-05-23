import type { AstroConfig, RouteData, RoutePart } from 'astro';

// https://vercel.com/docs/project-configuration#legacy/routes
interface VercelRoute {
	src: string;
	methods?: string[];
	dest?: string;
	headers?: Record<string, string>;
	status?: number;
	continue?: boolean;
}

// Copied from /home/juanm04/dev/misc/astro/packages/astro/src/core/routing/manifest/create.ts
// 2022-04-26
function getMatchPattern(segments: RoutePart[][]) {
	return segments
		.map((segment) => {
			return segment[0].spread
				? '(?:\\/(.*?))?'
				: '\\/' +
						segment
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
												.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
							})
							.join('');
		})
		.join('');
}

function appendTrailingSlash(route: string): string {
	return route.at(-1) === '/' ? route : route + '/';
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
	if(route.redirectRoute) {
		const pattern = getReplacePattern(route.redirectRoute.segments);
		const path = (config.trailingSlash === 'always' ? appendTrailingSlash(pattern) : pattern);
		return config.base + path;
	} else {
		return config.base + route.redirect;
	}	
}

export function getRedirects(routes: RouteData[], config: AstroConfig): VercelRoute[] {
	let redirects: VercelRoute[] = [];

	for(const route of routes) {
		if(route.type === 'redirect') {
			if(true || route.pathname) {
				redirects.push({
					src: config.base + getMatchPattern(route.segments),
					headers: { Location: getRedirectLocation(route, config) },
					status: 301
				})
			} else {
				console.error(`Dynamic routes not yet supported`);
			}
		} else if (route.type === 'page') {
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
