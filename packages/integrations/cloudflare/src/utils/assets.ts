import type { AstroConfig, ImageMetadata, RemotePattern } from 'astro';

export function isESMImportedImage(src: ImageMetadata | string): src is ImageMetadata {
	return typeof src === 'object';
}
export function isRemotePath(src: string) {
	return /^(http|ftp|https|ws):?\/\//.test(src) || src.startsWith('data:');
}
export function matchHostname(url: URL, hostname?: string, allowWildcard?: boolean) {
	if (!hostname) {
		return true;
	} else if (!allowWildcard || !hostname.startsWith('*')) {
		return hostname === url.hostname;
	} else if (hostname.startsWith('**.')) {
		const slicedHostname = hostname.slice(2); // ** length
		return slicedHostname !== url.hostname && url.hostname.endsWith(slicedHostname);
	} else if (hostname.startsWith('*.')) {
		const slicedHostname = hostname.slice(1); // * length
		const additionalSubdomains = url.hostname
			.replace(slicedHostname, '')
			.split('.')
			.filter(Boolean);
		return additionalSubdomains.length === 1;
	}

	return false;
}
export function matchPort(url: URL, port?: string) {
	return !port || port === url.port;
}
export function matchProtocol(url: URL, protocol?: string) {
	return !protocol || protocol === url.protocol.slice(0, -1);
}
export function matchPathname(url: URL, pathname?: string, allowWildcard?: boolean) {
	if (!pathname) {
		return true;
	} else if (!allowWildcard || !pathname.endsWith('*')) {
		return pathname === url.pathname;
	} else if (pathname.endsWith('/**')) {
		const slicedPathname = pathname.slice(0, -2); // ** length
		return slicedPathname !== url.pathname && url.pathname.startsWith(slicedPathname);
	} else if (pathname.endsWith('/*')) {
		const slicedPathname = pathname.slice(0, -1); // * length
		const additionalPathChunks = url.pathname
			.replace(slicedPathname, '')
			.split('/')
			.filter(Boolean);
		return additionalPathChunks.length === 1;
	}

	return false;
}
export function matchPattern(url: URL, remotePattern: RemotePattern) {
	return (
		matchProtocol(url, remotePattern.protocol) &&
		matchHostname(url, remotePattern.hostname, true) &&
		matchPort(url, remotePattern.port) &&
		matchPathname(url, remotePattern.pathname, true)
	);
}
export function isRemoteAllowed(
	src: string,
	{
		domains = [],
		remotePatterns = [],
	}: Partial<Pick<AstroConfig['image'], 'domains' | 'remotePatterns'>>
): boolean {
	if (!isRemotePath(src)) return false;

	const url = new URL(src);
	return (
		domains.some((domain) => matchHostname(url, domain)) ||
		remotePatterns.some((remotePattern) => matchPattern(url, remotePattern))
	);
}
export function isString(path: unknown): path is string {
	return typeof path === 'string' || path instanceof String;
}
export function removeTrailingForwardSlash(path: string) {
	return path.endsWith('/') ? path.slice(0, path.length - 1) : path;
}
export function removeLeadingForwardSlash(path: string) {
	return path.startsWith('/') ? path.substring(1) : path;
}
export function trimSlashes(path: string) {
	return path.replace(/^\/|\/$/g, '');
}
export function joinPaths(...paths: (string | undefined)[]) {
	return paths
		.filter(isString)
		.map((path, i) => {
			if (i === 0) {
				return removeTrailingForwardSlash(path);
			} else if (i === paths.length - 1) {
				return removeLeadingForwardSlash(path);
			} else {
				return trimSlashes(path);
			}
		})
		.join('/');
}
