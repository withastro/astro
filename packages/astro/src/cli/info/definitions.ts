import type { AstroConfig } from '../../types/public/index.js';
import type { DebugInfo } from './domain/debug-info.js';

export interface DebugInfoProvider {
	get: () => Promise<DebugInfo>;
}

export interface DebugInfoFormatter {
	format: (info: DebugInfo) => string;
}

export interface Clipboard {
	copy: (input: string) => Promise<void>;
}

export interface PackageManager {
	getName: () => string;
	getPackageVersion: (name: string) => Promise<string | undefined>;
}

export interface OperatingSystemProvider {
	getName: () => string;
}

export interface AstroConfigResolver {
	resolve: () => Promise<AstroConfig>;
}
