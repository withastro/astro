import type { NormalizedSessionDriverConfig, SessionDriverConfig } from './types.js';
import type { SSRManifestSession } from '../app/types.js';
import type { AstroConfig } from '../../types/public/index.js';
export declare function normalizeSessionDriverConfig(
	driver: string | SessionDriverConfig,
	/** @deprecated */
	options?: Record<string, any>,
): NormalizedSessionDriverConfig;
export declare function sessionConfigToManifest(
	config: AstroConfig['session'],
): SSRManifestSession | undefined;
