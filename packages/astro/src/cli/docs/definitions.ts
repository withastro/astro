import type { StdioOptions } from 'node:child_process';
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
			env?: Record<string, string | undefined>;
			shell?: boolean;
			input?: string;
			stdio?: StdioOptions;
		},
	) => Promise<{ stdout: string }>;
}
