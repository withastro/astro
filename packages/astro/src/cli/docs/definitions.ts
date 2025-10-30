import type { Platform } from './domains/platform.js';

export interface PlatformProvider {
	get: () => Platform;
}

export interface CommandExecutor {
	execute: (
		command: string,
		args?: Array<string>,
		options?: {
			cwd?: string;
			env: Record<string, string | undefined>;
		},
	) => Promise<{ stdout: string }>;
}
