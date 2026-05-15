import type { LogLevel, Logger as ViteLogger } from 'vite';
import { type AstroLogger as AstroLogger } from './core.js';
export declare function createViteLogger(
	astroLogger: AstroLogger,
	viteLogLevel?: LogLevel,
): ViteLogger;
