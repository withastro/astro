import type { AstroSettings } from '../../types/astro.js';
import type { AstroConfig, CspAlgorithm } from '../../types/public/index.js';
import type { BuildInternals } from '../build/internal.js';
import type { CspDirective } from './config.js';
type EnabledCsp = Exclude<AstroConfig['security']['csp'], false>;
export declare function shouldTrackCspHashes(csp: any): csp is EnabledCsp;
export declare function getAlgorithm(csp: EnabledCsp): CspAlgorithm;
export declare function getScriptHashes(csp: EnabledCsp): string[];
export declare function getScriptResources(csp: EnabledCsp): string[];
export declare function getStyleHashes(csp: EnabledCsp): string[];
export declare function getStyleResources(csp: EnabledCsp): string[];
export declare function getDirectives(settings: AstroSettings): CspDirective[];
export declare function getStrictDynamic(csp: EnabledCsp): boolean;
export declare function trackStyleHashes(
	internals: BuildInternals,
	settings: AstroSettings,
	algorithm: CspAlgorithm,
): Promise<string[]>;
export declare function trackScriptHashes(
	internals: BuildInternals,
	settings: AstroSettings,
	algorithm: CspAlgorithm,
): Promise<string[]>;
export {};
