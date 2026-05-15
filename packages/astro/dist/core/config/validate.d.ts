import type { AstroConfig } from '../../types/public/config.js';
/** Turn raw config values into normalized values */
export declare function validateConfig(
	userConfig: any,
	root: string,
	cmd: string,
): Promise<AstroConfig>;
/**
 * Used twice:
 * - To validate the user config
 * - To validate the config after all integrations (that may have updated it)
 */
export declare function validateConfigRefined(updatedConfig: AstroConfig): Promise<AstroConfig>;
