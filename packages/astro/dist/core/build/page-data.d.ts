import type { AstroSettings, RoutesList } from '../../types/astro.js';
import type { AstroLogger } from '../logger/core.js';
import type { AllPagesData } from './types.js';
interface CollectPagesDataOptions {
	settings: AstroSettings;
	logger: AstroLogger;
	manifest: RoutesList;
}
interface CollectPagesDataResult {
	assets: Record<string, string>;
	allPages: AllPagesData;
}
export declare function collectPagesData(opts: CollectPagesDataOptions): CollectPagesDataResult;
export {};
