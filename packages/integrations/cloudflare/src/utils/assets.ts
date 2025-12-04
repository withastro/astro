import { isRemotePath } from '@astrojs/internal-helpers/path';
import { matchHostname, matchPattern } from '@astrojs/internal-helpers/remote';
import type { AstroConfig } from 'astro';

export function isRemoteAllowed(
	src: string,
	{
		domains = [],
		remotePatterns = [],
	}: Partial<Pick<AstroConfig['image'], 'domains' | 'remotePatterns'>>,
): boolean {
	if (!isRemotePath(src)) return false;

	const url = new URL(src);
	return (
		domains.some((domain) => matchHostname(url, domain)) ||
		remotePatterns.some((remotePattern) => matchPattern(url, remotePattern))
	);
}
