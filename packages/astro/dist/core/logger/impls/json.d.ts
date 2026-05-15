import {
	AstroLogger,
	type AstroLoggerDestination,
	type AstroLoggerLevel,
	type AstroLoggerMessage,
} from '../core.js';
import type { AstroInlineConfig } from '../../../types/public/index.js';
export type JsonHandlerConfig = {
	/**
	 * Whether the JSON line should format on multiple lines
	 */
	pretty?: boolean;
	/**
	 * The level of logs that should be printed by the logger.
	 */
	level?: AstroLoggerLevel;
};
export declare const SGR_REGEX: RegExp;
export default function jsonLoggerDestination(
	config?: JsonHandlerConfig,
): AstroLoggerDestination<AstroLoggerMessage>;
export declare function createJsonLoggerFromFlags(config: AstroInlineConfig): AstroLogger;
