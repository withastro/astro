import {
	AstroLogger,
	type AstroLoggerDestination,
	type AstroLoggerLevel,
	type AstroLoggerMessage,
} from '../core.js';
import type { AstroInlineConfig } from '../../../types/public/index.js';
export type NodeHandlerConfig = {
	level?: AstroLoggerLevel;
};
export default function (options?: NodeHandlerConfig): AstroLoggerDestination<AstroLoggerMessage>;
export declare function createNodeLoggerFromFlags(inlineConfig: AstroInlineConfig): AstroLogger;
