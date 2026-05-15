import type { AstroSettings, RoutesList } from '../../types/astro.js';
export declare function injectImageEndpoint(
	settings: AstroSettings,
	manifest: RoutesList,
	mode: 'dev' | 'build',
	cwd?: string,
): void;
