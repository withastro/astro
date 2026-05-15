import type { Redirect } from '@vercel/routing-utils';
import type { AstroConfig, IntegrationResolvedRoute } from 'astro';
export declare function escapeRegex(content: string): string;
export declare function getRedirects(
	routes: IntegrationResolvedRoute[],
	config: AstroConfig,
): Redirect[];
