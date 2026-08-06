import type { AstroConfig } from '../../types/public/index.js';
import type { DebugInfo } from './domain/debug-info.js';

export interface DebugInfoProvider {
	get: () => Promise<DebugInfo>;
}

export interface DebugInfoFormatter {
	format: (info: DebugInfo) => string;
}

export interface Clipboard {
	copy: (text: string) => Promise<void>;
}

export interface PackageManager {
	readonly name: string;
	getPackageVersion: (name: string) => Promise<string | undefined>;
}

export interface AstroConfigResolver {
	resolve: () => Promise<AstroConfig>;
}

export interface Prompt {
	confirm: (input: { message: string; defaultValue?: boolean }) => Promise<boolean>;
}

export interface PackageManagerUserAgentProvider {
	readonly userAgent: string | null;
}

export interface NodeVersionProvider {
	readonly version: string;
}
