import type { HelpPayload } from './domain/help-payload.js';

export interface KeyGenerator {
	generate: () => Promise<string>;
}

export interface HelpDisplay {
	shouldFire: () => boolean;
	show: (payload: HelpPayload) => void;
}

export interface TextStyler {
	bgWhite: (msg: string) => string;
	black: (msg: string) => string;
	dim: (msg: string) => string;
	green: (msg: string) => string;
	bold: (msg: string) => string;
	bgGreen: (msg: string) => string;
}

export interface AstroVersionProvider {
	getVersion: () => string;
}
