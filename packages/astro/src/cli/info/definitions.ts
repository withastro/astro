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

export interface PackageManagerProvider {
	getName: () => string;
}

export interface OperatingSystemProvider {
	getName: () => string;
}

export interface PackageVersionProvider {
	getVersion: (name: string) => Promise<string | undefined>;
}
