import type { AstroSettings } from '../../types/astro.js';
import type { AstroAdapter } from '../../types/public/integrations.js';
import type { AstroLogger } from '../logger/core.js';
export declare function warnMissingAdapter(logger: AstroLogger, settings: AstroSettings): void;
export declare function validateSetAdapter(
	logger: AstroLogger,
	settings: AstroSettings,
	adapter: AstroAdapter,
	maybeConflictingIntegration: string,
	command?: 'dev' | 'build' | string,
): void;
