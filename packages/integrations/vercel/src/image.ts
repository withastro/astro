import type { AstroConfig } from 'astro';

export interface VercelImageConfig {
	sizes: number[];
	domains: string[];
	remotePatterns?: {
		protocol?: 'http' | 'https';
		hostname: string;
		port?: string;
		pathname?: string;
	}[];
	minimumCacheTTL?: number;
	formats?: ('image/avif' | 'image/webp')[];
	dangerouslyAllowSVG?: boolean;
	contentSecurityPolicy?: string;
}

// TODO: Remove once Astro 3.0 is out and `experimental.assets` is no longer needed
export function throwIfAssetsNotEnabled(
	config: AstroConfig,
	imageConfig: VercelImageConfig | undefined
) {
	if (!config.experimental.assets && imageConfig) {
		throw new Error(
			`Using the Vercel Image Optimization API requires \`experimental.assets\` to be enabled. See https://docs.astro.build/en/guides/assets/ for more information.`
		);
	}
}
