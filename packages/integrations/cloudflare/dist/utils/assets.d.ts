import type { AstroConfig } from 'astro';
export declare function isRemoteAllowed(
	src: string,
	{ domains, remotePatterns }: Partial<Pick<AstroConfig['image'], 'domains' | 'remotePatterns'>>,
): boolean;
