import type { AstroPreferences } from '../../preferences/index.js';
export declare const MAX_PATCH_DISTANCE = 5;
export declare function fetchLatestAstroVersion(
	preferences: AstroPreferences | undefined,
): Promise<string>;
export declare function shouldCheckForUpdates(preferences: AstroPreferences): Promise<boolean>;
