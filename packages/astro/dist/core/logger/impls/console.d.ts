import {
	type AstroLoggerMessage,
	type AstroLoggerDestination,
	type AstroLoggerLevel,
	AstroLogger,
} from '../core.js';
import type { NodeHandlerConfig } from './node.js';
export type ConsoleHandlerConfig = {
	level?: AstroLoggerLevel;
};
export declare function createConsoleLogger({ level }: { level: AstroLoggerLevel }): AstroLogger;
export default function (options?: NodeHandlerConfig): AstroLoggerDestination<AstroLoggerMessage>;
