import type { AstroLogMessage, AstroLoggerLevel } from '../../core/logger/core.js';

export type { AstroLogMessage, AstroLoggerLevel };

export type AstroLoggerDestination<D> = {
	write: (chunk: D | AstroLogMessage) => void;
};
